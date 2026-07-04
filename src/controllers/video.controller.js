import mongoose from "mongoose";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/apiErrors";
import { ApiResponse } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";

const uploadVideo = asyncHandler(async(req,res)=>{

    // 1. Get video and thumbnail files from multer
    const video = req.files?.video?.[0]
    const thumbnail = req.files?.thumbnail?.[0]

    // 2. Get video details from request body
    const {title,description,tags,isPublished} = req.body

    // 3. Validate required fields
    if(!title?.trim() || !description?.trim() || !tags || isPublished)
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
            thumbnail:savedThumbnail.url
        })

        // 9. Check database creation
        if(!finalVideo)
            throw new ApiError(500,"Cannot store video information")

        // 10. Fetch created video with owner details
        const response = await Video.findById(finalVideo._id)
            .populate("owner","username avatar")

        // 11. Return uploaded video response
        return res.status(201).json(
            new ApiResponse(
                201,
                response,
                "Video uploaded successfully"
            )
        )

    }catch(error){

        // 12. Delete already uploaded files if database/cloudinary process fails
        const video_publicId = savedVideo.split("/").pop().split(".")[0]
        const thumbnail_publicId = thumbnail.split("/").pop().split(".")[0]
        if(video_publicId)
            await deleteFromCloudinary(savedVideo.public_id)

        if(thumbnail_publicId)
            await deleteFromCloudinary(savedThumbnail.public_id)

        throw new ApiError(500,"Something went wrong while uploading video")
    }
})

const getVideoById = asyncHandler(async(req,res)=>{

    // 1. get video_id form params | check if video_id is not empty
    // 2. get video from db with appropriate projection and populate owner details
    // 3. validate if video is not empty 
    // 4. return response
    const video_id = req.params.videoId

    const video_stats = await Video.aggregate([
        {
            $match : {_id:new mongoose.Types.ObjectId(video_id)}
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'ownerDetails',
                // can make seprate pipeline to fetch subscriberCount|subscribedToCount etc...
                pipeline:[
                    {
                       $lookup:{
                        from:'subscriptions',
                        localField:'_id',
                        foreignField:'channel',
                        as:'subscribers'
                       }
                    },
                    {
                        $addFields:{
                            subscriberCount:{$size:'$subscribers'}
                        }
                    },
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            subscriberCount:1,
                        }
                    }
                ]
            }
        },
        {
            $unwind:'$ownerDetails'
        },
        {
            $project:{
                _id:0,
                title:1,
                description:1,
                tags:1,
                videoFile:1,
                thumbnail:1,
                duration:1,
                views:1,
                ownerDetails:1
            }
        }
    ])

    if(!video_stats.length) throw new ApiError(404,"video not found");
    
    return res.status(200).json(
        new ApiResponse(200,video_stats[0],"Video fetched Successfully!")
    )
})

const watchVideo = asyncHandler(async (req, res) => {
    const videoId = req.params?.videoId;

    if (!videoId) {
        throw new ApiError(400, "Cannot get videoId from param");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const session = await mongoose.startSession(); // transaction is used in production => all db call passes or all fails...
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
                session // used to tell that this db call belongs to this transaction
            }
        ).select("_id title views");

        if (!updatedView) {
            throw new ApiError(404, "Cannot find video");
        }

        // Update user's watch history
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    watchHistory: videoId
                },
                $push: {
                    watchHistory: videoId
                }
            },
            {
                session
            }
        );

        if (!updatedUser) {
            throw new ApiError(404, "Cannot update watch history");
        }

        // Save both changes
        await session.commitTransaction();

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
// Method: PATCH
// Route: /videos/:videoId/edit-thumbnail

// 1. Get videoId from params and validate it.

// 2. Get thumbnail from req.file.
//    - If missing → ApiError(400).

// 3. Fetch video document.
//    - If not found → 404.
//    - Verify req.user is the owner.
//    - Save old thumbnail URL (or publicId).

// 4. Upload the new thumbnail to Cloudinary.
//    - If upload fails → ApiError(500).

// 5. Update video.thumbnail in the database.
//    - If update fails:
//        - Delete the newly uploaded thumbnail from Cloudinary.
//        - Throw ApiError(500).

// 6. Delete the old thumbnail from Cloudinary.
//    - If deletion fails:
//        - Log the error (recommended).
//        - Do not fail the request because the DB already points to the new thumbnail.

// 7. Return the updated video.

const videoId = req.params.videoId;
if(!videoId) throw new ApiError(404,"Cannot get vidoeId from param")

const thumbnailPath = req.file?.path
if(!thumbnailPath) throw new ApiError(400,"please upload thumbnail first")

    //find()=> returns array || findOne()=> return one document or null
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

return res.status(200).json(
    new ApiResponse(200,dbUpdateResponse)
)


})

const updateVideoDetial = asyncHandler(async(req,res)=>{
    // method - PATCH | route - /video/:videoId/edit-video-detail

    const {title,description,tags} = req.body
    // At least one field must be provided
    if (
        title === undefined &&
        description === undefined &&
        tags === undefined
    ) {
        throw new ApiError(400, "At least one field is required");
    }

    // If provided, it must not be empty
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
    ...(title !== undefined && { title }), // ...(field) means updateFields.field = field; | shortner syntax
    ...(description !== undefined && { description }),
    ...(tags !== undefined && { tags })
    };

    const updatedVideo = await Video.findOneAndUpdate(
        {
            _id: videoId,
            owner: req.user._id // ownership check
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


    return res.status(200).json(
        new ApiResponse(200,updatedVideo,"video Details updated successfully")
    )

})

const toggleIsPublish = asyncHandler(async(req,res)=>{
    const videoId = req.params.videoId;
    if(!videoId) throw new ApiError(400,"videoId is required")

    // checks whether the value has the correct format for a MongoDB ObjectId.
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"Invalid Video id")

    const toggleResponse = await Video.findOneAndUpdate({_id:videoId, owner:req.user?._id},
        [{ // pipeline update concept
            $set:{
                isPublished:{$not:'$isPublished'}
            }
        }],
        {returnDocument:'after'}
    ).populate("owner","username").select("_id owner isPublished title")
    //output format
//    {
//     "_id": "v123",
//     "title": "MongoDB Aggregation",
//     "isPublished": false,
//     "owner": {
//     "_id": "u456",
//     "username": "griffith"
//             }
//     }

    if(!toggleResponse) throw new ApiError(404,"Cannot find video || you are not owner");

    return res.status(200).json(
        new ApiResponse(200,toggleResponse,"isPublished toggled")
    )
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const videoId = req.params.videoId;
    if(!videoId) throw new ApiError(404,"Cannot find videoId")

    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"Invalid videoId")

    const deletedResponse = await Video.findOneAndDelete({_id:videoId, owner:req.user?._id}) // always returns deleted doc
    if(!deletedResponse) throw new ApiError(404, "video not found | you're not the owner")

    const videoDeleteFromCloudinary = await deleteFromCloudinary(deletedResponse.videoFile.split("/").pop().split(".")[0]);
    const thumbnailDeletedFromCloudinary = await deleteFromCloudinary(deletedResponse.thumbnail.split("/").pop().split(".")[0])

    if(!videoDeleteFromCloudinary || !thumbnailDeletedFromCloudinary) console.error("Cannot delete video/thumbnail from cloudinary")

    return res.status(200).json(
        new ApiResponse(200,deletedResponse,"Video Deleted Sucessfully...")
    )

    
})

const getVideoFeed = asyncHandler(async (req, res) => {
    const { mode, search } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;

    const feedPipeline = getAllVideoPipeline({
        limit,
        page,
        search,
        mode
    });

    const videos = await Video.aggregate(feedPipeline);

    return res.status(200).json(
        new ApiResponse(
            200,
            videos[0],
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
    const limit = 10;

    // Get last 5 watched videos with their tags
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

    // If user has no watch history
    if (!recentVideos.length || !recentVideos[0].recentVideos.length) {
        throw new ApiError(
            404,
            "No watch history found to generate recommendations"
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
            recommendedVideos[0],
            "Recommended videos fetched successfully"
        )
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId)
        throw new ApiError(401, "Unauthorized request");

    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new ApiError(400, "Invalid user id");

    const pipeline = getWatchedHistoryVideosPipeline({
        userId,
        limit: 150
    });

    const history = await User.aggregate(pipeline);

    const watchedVideos = history[0]?.watchedVideos || [];

    // Optional: newest watched first
    watchedVideos.reverse();

    return res.status(200).json(
        new ApiResponse(
            200,
            watchedVideos[0],
            "Watch history fetched successfully"
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

export {uploadVideo, getVideoById, watchVideo, updateThumbnail, updateVideoDetial, toggleIsPublish, deleteVideo, getVideoFeed, getPersonalisedVideos, getWatchHistory, getVideoLikes}