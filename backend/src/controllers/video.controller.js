import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/likes.model.js";
import recommendedPipeline from "../pipelines/personlised.pipeline.js";
import { getAllVideoPipeline } from "../pipelines/getAllVideo.pipeline.js";
import redis from "../config/redis.config.js";
import { videoQueue } from "../queue/video.queue.js";

const uploadVideo = asyncHandler(async(req,res)=>{
    // 1. Get video and thumbnail files from multer
    const video = req.files?.video?.[0]
    const thumbnail = req.files?.thumbnail?.[0]

    // 2. Get video details from request body
    const {title,description,tags} = req.body

    const isPublished =
    req.body.isPublished !== undefined
        ? req.body.isPublished === "true"
        : false;

    // 3. Validate required fields
    if(!title?.trim() || !description?.trim() || !tags)
        throw new ApiError(400,"Required fields missing")

    // 4. Validate uploaded files
    if(!video?.path || !thumbnail?.path)
        throw new ApiError(400,"Video and thumbnail are required")

    // 5. Store cloudinary response for cleanup if any step fails
    let savedVideo = null
    let savedThumbnail = null

    try{
        // 6. Upload video and thumbnail to Cloudinary
        savedVideo = await uploadOnCloudinary(video.path)
        savedThumbnail = await uploadOnCloudinary(thumbnail.path)

        // 7. Check Cloudinary upload success
        if(!savedVideo || !savedThumbnail)
            throw new ApiError(500,"Cloudinary upload failed")

        // 8. Create video document in database
        const finalVideo = await Video.create({
            title,
            description,
            tags,
            isPublished,
            duration:savedVideo.duration,
            owner:req.user._id,
            videoFile:savedVideo.url,
            thumbnail:savedThumbnail.url,
            processingStatus: "queued"
        })

        // 9. Check database creation
        if(!finalVideo)
            throw new ApiError(500,"Cannot store video information")

        // 10. Add job to video queue for processing
        await videoQueue.add("process-video", { videoId: finalVideo._id });

        // 11. Fetch created video with owner details
        const response = await Video.findById(finalVideo._id)
            .populate("owner","username avatar")

        // Cache the newly created video in Redis to avoid Atlas database roundtrips during transcoding
        try {
            await redis.set(
                `video:${finalVideo._id}`,
                JSON.stringify(response),
                "EX",
                1800
            );
            console.log(`Cached newly created video:${finalVideo._id} in Redis`);
        } catch (cacheErr) {
            console.error("Failed to cache newly created video in Redis:", cacheErr);
        }

        // 12. Return uploaded video response
        return res.status(202).json(
            new ApiResponse(
                202,
                response,
                "Video upload accepted and queued for processing"
            )
        )
    }catch(error){
        // 13. Delete already uploaded files if database/cloudinary process fails
        if(savedVideo?.public_id)
            await deleteFromCloudinary(savedVideo.public_id)
        if(savedThumbnail?.public_id)
            await deleteFromCloudinary(savedThumbnail.public_id)
        throw new ApiError(500, error?.message || "Something went wrong while uploading video")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const video_id = req.params.videoId;

    if (!video_id)
        throw new ApiError(400, "Video id is required.");

    if (!mongoose.Types.ObjectId.isValid(video_id))
        throw new ApiError(400, "Invalid video id.");

    // ---------------- Parallel operations ----------------
    const [cachedVideo, likedDoc, likesCount] = await Promise.all([
        redis.get(`video:${video_id}`),

        Like.exists({
            video: video_id,
            likedBy: req.user._id
        }),

        Like.countDocuments({
            video: video_id
        })
    ]);

    const isLiked = !!likedDoc;

    // ================= CACHE HIT =================

    if (cachedVideo) {
        const videoData = JSON.parse(cachedVideo);
        videoData.likesCount = likesCount;

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    ...videoData,
                    isLiked
                },
                "Video fetched successfully."
            )
        );
    }

    // ================= CACHE MISS =================

    const video_stats = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(video_id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscriberCount: {
                                $size: "$subscribers"
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            subscribersCount: "$subscriberCount"
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                tags: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: "$ownerDetails",
                processingStatus: 1,
                availableResolutions: 1
            }
        }
    ]);

    if (!video_stats.length)
        throw new ApiError(404, "Video not found.");

    const videoData = video_stats[0];
    videoData.likesCount = likesCount;

    // Cache static/shared metadata
    try {
        await redis.set(
            `video:${video_id}`,
            JSON.stringify(videoData),
            "EX",
            1800
        );
    } catch (cacheErr) {
        console.error("Failed to cache video in Redis in getVideoById:", cacheErr);
    }

    const videoDataObj = typeof videoData.toObject === 'function' ? videoData.toObject() : videoData;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                ...videoDataObj,
                isLiked
            },
            "Video fetched successfully."
        )
    );
});

const watchVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    
    console.log("watchVideo called - videoId:", videoId, "userId:", userId);

    if (!videoId) {
        throw new ApiError(400, "Cannot get videoId from param");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Increment video views
        const updatedView = await Video.findByIdAndUpdate(
            videoId,
            {
                $inc: { views: 1 }
            },
            {
                returnDocument: "after",
                session
            }
        ).select("_id title views");

        if (!updatedView) {
            throw new ApiError(404, "Cannot find video");
        }

        // Update user's watch history
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    watchHistory: videoId
                }
            },
            {
                session
            }
        );

        const pushVideo = await User.findByIdAndUpdate(req.user._id,
            {
                $push:{
                    watchHistory: videoId
                }
            },
            {session}
        )

        if (!pushVideo) {
            throw new ApiError(404, "Cannot update watch history");
        }

        // Save both changes
        await session.commitTransaction();
        console.log("Watch history updated successfully for user:", userId);

        return res.status(200).json(
            new ApiResponse(
                200,
                updatedView,
                "Video watched successfully"
            )
        );
    }
    catch (error) {
        // Undo all changes
        await session.abortTransaction();
        throw error
    }
    finally {
        session.endSession();
    }
});

const updateThumbnail = asyncHandler(async(req,res)=>{
    const videoId = req.params.videoId;
    if(!videoId) throw new ApiError(404,"Cannot get vidoeId from param")

    const thumbnailPath = req.file?.path
    if(!thumbnailPath) throw new ApiError(400,"please upload thumbnail first")

    const video = await Video.findOne({_id:videoId, owner:req.user?._id});
    if(!video) throw new ApiError(404,"Cannot find video")

    let oldThumbnail = video.thumbnail;
    oldThumbnail = oldThumbnail.split("/").pop().split(".")[0]

    const newThumbnailResponse = await uploadOnCloudinary(thumbnailPath);
    if(!(newThumbnailResponse?.url)) throw new ApiError(500,"Cannot ulpoad new thumbnail")

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const dbUpdateResponse = await Video.findByIdAndUpdate(videoId,
                                        {thumbnail:newThumbnailResponse.url},
                                        {
                                            returnDocument:'after',
                                        }
                                    ).select("_id title owner").populate("owner","username")
    if(!dbUpdateResponse) {
        const deleteNewThumbnail = await deleteFromCloudinary(newThumbnailResponse.url.split("/").pop().split(".")[0])
        if(!deleteNewThumbnail) throw new ApiError(500,"Cannot update db and delete old thumbnail");

        throw new ApiError(500,"Cannot update video with new thumbnail")
    }

    const deleteOldThumbnail = await deleteFromCloudinary(oldThumbnail)
    if(!deleteOldThumbnail) console.error("Failed to delete old thumbnail from Cloudinary");

    const deleteRedis = await redis.del(`video:${videoId}`);
    if(deleteRedis===0) console.log(`Cannot Invalidate from cache...`);

    return res.status(200).json(
        new ApiResponse(200,dbUpdateResponse)
    )
})

const updateVideoDetial = asyncHandler(async(req,res)=>{
    const {title,description,tags} = req.body
    if (
        title === undefined &&
        description === undefined &&
        tags === undefined
    ) {
        throw new ApiError(400, "At least one field is required");
    }

    if (title !== undefined && title.trim() === "") {
        throw new ApiError(400, "Title cannot be empty");
    }

    if (description !== undefined && description.trim() === "") {
        throw new ApiError(400, "Description cannot be empty");
    }

    if (tags !== undefined && tags.length === 0) {
        throw new ApiError(400, "Tags cannot be empty");
    }

    const videoId = req.params.videoId
    if(!videoId) throw new ApiError(400,"VideoId is required...");
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"Invalid videoId..")

    const updateFields = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(tags !== undefined && { tags })
    };

    const updatedVideo = await Video.findOneAndUpdate(
        {
            _id: videoId,
            owner: req.user._id
        },
        updateFields,
        {
            returnDocument: "after"
        }
    )
    .select("_id title description tags owner")
    .populate("owner", "username");

    if (!updatedVideo) {
        throw new ApiError(404, "cannot update video details || not owner || video not found");
    }

    const deleteRedis = await redis.del(`video:${videoId}`);
    if(deleteRedis===0) console.log(`Cannot Invalidate from cache...`);

    return res.status(200).json(
        new ApiResponse(200,updatedVideo,"video Details updated successfully")
    )
})

const toggleIsPublish = asyncHandler(async(req,res)=>{
    const videoId = req.params.videoId;
    if(!videoId) throw new ApiError(400,"videoId is required")

    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"Invalid Video id")

    const toggleResponse = await Video.findOneAndUpdate({_id:videoId, owner:req.user?._id},
        [{
            $set:{
                isPublished:{$not:'$isPublished'}
            }
        }],
        {returnDocument:'after'}
    ).populate("owner","username").select("_id owner isPublished title")

    if(!toggleResponse) throw new ApiError(404,"Cannot find video || you are not owner");

    const deleteRedis = await redis.del(`video:${videoId}`);
    if(deleteRedis===0) console.log(`Cannot Invalidate from cache...`);

    return res.status(200).json(
        new ApiResponse(200,toggleResponse,"isPublished toggled")
    )
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const videoId = req.params.videoId;
    if(!videoId) throw new ApiError(404,"Cannot find videoId")
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"Invalid videoId")

    const deletedResponse = await Video.findOneAndDelete({_id:videoId, owner:req.user?._id})
    if(!deletedResponse) throw new ApiError(404, "video not found | you're not the owner")

    try {
        await Promise.all([
            await deleteFromCloudinary(deletedResponse.videoFile.split("/").pop().split(".")[0]),
            await deleteFromCloudinary(deletedResponse.thumbnail.split("/").pop().split(".")[0])
        ])
    } catch (error) {
        console.log(`Cannot delete from cloudinary : \n${error}`)
    }
    try {
        await Promise.all([
            redis.del(`video:${videoId}`),
            redis.del(`views:${videoId}`)
        ])
    } catch (error) {
        console.log(`Redis video invalidation failed\n${error}`)
    }

    return res.status(200).json(
        new ApiResponse(200,deletedResponse,"Video Deleted Sucessfully...")
    )
})

const getVideoFeed = asyncHandler(async (req, res) => {
    const { mode, search, channelId } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const feedPipeline = getAllVideoPipeline({
        limit,
        page,
        search,
        mode,
        channelId,
        userId: req.user?._id
    });

    const videos = await Video.aggregate(feedPipeline);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                ...videos[0],
                page,
                limit
            },
            "Video feed fetched successfully."
        )
    );
});

const getPersonalisedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "User Id is required");
    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new ApiError(404, "No user found");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit)||10,50);

    const recentVideos = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                recentVideoIds: {
                    $slice: ["$watchHistory", -5]
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "recentVideoIds",
                foreignField: "_id",
                as: "recentVideos",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            tags: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                _id: 0,
                recentVideos: 1
            }
        }
    ]);

    if (!recentVideos.length || !recentVideos[0].recentVideos.length) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { metadata: [ { totalVideos: 0 } ], videos: [] },
                "No watch history found to generate recommendations"
            )
        );
    }

    const watchedVideoIds = recentVideos[0].recentVideos.map(
        (video) => video._id
    );

    const extractedTags = [
        ...new Set(
            recentVideos[0].recentVideos.flatMap(
                (video) => video.tags
            )
        )
    ];

    const pipeline = recommendedPipeline({
        page,
        limit,
        extractedTags,
        watchedVideoIds
    });

    const recommendedVideos = await Video.aggregate(pipeline);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                ...recommendedVideos[0],
                page,
                limit
            },
            "Recommended videos fetched successfully"
        )
    );
});

const getVideoLikes = asyncHandler(async (req, res) => {
    const videoId = req.params?.videoId?.trim();

    if (!videoId)
        throw new ApiError(400, "VideoId is required");

    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(400, "Invalid MongoDB id");

    const existVideo = await Video.exists({ _id: videoId });

    if (!existVideo)
        throw new ApiError(404, "Video not found");

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
        Math.max(Number(req.query.limit) || 20, 1),
        100
    );

    const likes = await Like.aggregate([
        {
            $match: {
                video: existVideo._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "likedBy",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$likedBy"
        },
        {
            $project: {
                _id: 1,
                username: "$likedBy.username",
                avatar: "$likedBy.avatar",
                createdAt: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $facet: {
                metadata: [
                    {
                        $count: "totalLikes"
                    }
                ],
                likes: [
                    {
                        $skip: (page - 1) * limit
                    },
                    {
                        $limit: limit
                    }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            likes[0],
            "Video likes fetched successfully"
        )
    );
});

export {uploadVideo, getVideoById, watchVideo, updateThumbnail, updateVideoDetial, toggleIsPublish, deleteVideo, getVideoFeed, getPersonalisedVideos, getVideoLikes}