import asyncHandler from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiErrors.js'
import {ApiResponse} from '../utils/apiResponse.js'
import mongoose from 'mongoose';
import { Playlist } from '../models/playlist.model.js';
import { Video } from '../models/video.model.js'

const createPlaylist = asyncHandler(async(req,res)=>{
    const {name, description} = req.body;
    if(!name || !description) throw new ApiError(400,"Name and description required...");

    const createPlaylistResponse = await Playlist.create({name,description,owner: req.user?._id});
    if(!createPlaylistResponse) throw new ApiError(400,"Bad reqeust, cannot create playlist");

    return res.status(201).json(
        new ApiResponse(201,createPlaylistResponse,"Playlist created successfully...")
    )
})

const addVideoInPlaylist = asyncHandler(async(req,res)=>{
    const { videoId, playlistId } = req.params;

    if(!playlistId || !videoId) throw new ApiError(400,"playlist and video required...");
    if(!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(400,"Invalid playlist or video Id ...");

    const existVideo = await Video.exists({_id: videoId})
    if(!existVideo) throw new ApiError(404,"video you're trying to upload not found...")


    const addVideoResponse = await Playlist.findOneAndUpdate(
        {_id:playlistId,
        owner:req.user?._id,
        videos:{$ne:videoId} // check if video is in playlist
        },
        {$addToSet:{videos:videoId}}, // note addToSet : preserves order and uniqueness
        {returnDocument:'after'}
    );
    if(!addVideoResponse) throw new ApiError(400,"Playlist not found, you are not the owner, or the video already exists in the playlist.");

    return res.status(200).json(
        new ApiResponse(200,addVideoResponse,"video added successfully...")
    )

})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{
    const { videoId, playlistId } = req.params;

    if(!playlistId || !videoId) throw new ApiError(400,"playlist and video required...");
    if(!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(400,"Invalid playlist or video Id ...");

    const existVideo = await Video.exists({_id: videoId})
    if(!existVideo) throw new ApiError(404,"video you're trying to upload not found...")

    const removeVideoResponse = await Playlist.findOneAndUpdate(
        {_id:playlistId,
        owner:req.user?._id,
        videos:videoId
        },
        {
            $pull:{videos:videoId} // pull: It removes matching element(s) from an array.
        },
        {
            returnDocument:'after'
        }
    )
    if(!removeVideoResponse) throw new ApiError(404,"video not found or  playlist not found or user not owner")

    return res.status(200).json(
    new ApiResponse(
        200,
        removeVideoResponse,
        "Video removed from playlist successfully."
        )
    );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId)
        throw new ApiError(400, "Playlist id is required.");

    if (!mongoose.Types.ObjectId.isValid(playlistId))
        throw new ApiError(400, "Invalid playlist id.");

    const deleteResponse = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id
    });

    if (!deleteResponse)
        throw new ApiError(
            404,
            "Playlist not found or you are not the owner."
        );

    return res.status(200).json(
        new ApiResponse(
            200,
            deleteResponse,
            "Playlist deleted successfully."
        )
    );
});

const updatePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if (!playlistId)
        throw new ApiError(400, "Playlist id is required.");

    if (!mongoose.Types.ObjectId.isValid(playlistId))
        throw new ApiError(400, "Invalid playlist id.");

    const {name, description} = req.body;
    if(!name && !description) throw new ApiError(400,"atleast one field(name or description) required");

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;

    const updateResponse = await Playlist.findOneAndUpdate({_id:playlistId, owner:req.user?._id},
        {...updateFields},
        {returnDocument:'after'}
    );

    if(!updateResponse) throw new ApiError(404,"playlist cannot found or user not owner");

    return res.status(200).json(
        new ApiResponse(200,updateResponse,"playlist details updated successfully...")
    );

});

const getPlaylistById = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if (!playlistId)
        throw new ApiError(400, "Playlist id is required.");

    if (!mongoose.Types.ObjectId.isValid(playlistId))
        throw new ApiError(400, "Invalid playlist id.");

    const playlistResponse = await Playlist.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(playlistId)
        }
    },

    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "playlistOwner"
        }
    },

    {
        $unwind: "$playlistOwner"
    },

    {
        $lookup: {
            from: "videos",

            let: {
                playlistVideos: "$videos"
            },

            pipeline: [
                {
                    $match: {
                        $expr: {
                            $in: [
                                "$_id",
                                "$$playlistVideos"
                            ]
                        }
                    }
                },

                {
                    $addFields: {
                        order: {
                            $indexOfArray: [
                                "$$playlistVideos",
                                "$_id"
                            ]
                        }
                    }
                },

                {
                    $sort: {
                        order: 1
                    }
                },

                {
                    $project: {
                        order: 0,
                        __v: 0 // __v is Mongoose's version key. after each save() __v increments
                    }
                }
            ],

            as: "playlistVideos"
        }
    },

    {
        $project: {
            name: 1,
            description: 1,

            owner: {
                _id: "$playlistOwner._id",
                username: "$playlistOwner.username",
                fullname: "$playlistOwner.fullname",
                avatar: "$playlistOwner.avatar"
            },

            videos: "$playlistVideos"
        }
    }
])

    if(playlistResponse.length === 0) throw new ApiError(404,"playlist not found");

    return res.status(200).json(
        new ApiResponse(200,playlistResponse[0],"playlist fetched successfully...")
    )

})

const getAllUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId)
        throw new ApiError(400, "User id is required.");

    if (!mongoose.Types.ObjectId.isValid(userId))
        throw new ApiError(400, "Invalid user id.");

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                videos: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: {
                updatedAt: -1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            playlists,
            "User playlists fetched successfully."
        )
    );
});

export { createPlaylist, addVideoInPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist, getPlaylistById, getAllUserPlaylists}