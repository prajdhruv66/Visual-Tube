import mongoose from "mongoose";
import { ApiError } from "../utils/apiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/likes.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";

const toggleVidoeLike = asyncHandler(async(req,res)=>{
    const videoId = req.params?.videoId;
    if(!videoId) throw new ApiError(400,"video id is required...");
    if((!mongoose.Types.ObjectId.isValid(videoId))) throw new ApiError(400,"Invalid video id...");

    const existVideo = await Video.exists({_id:videoId});
    if(!existVideo) throw new ApiError(404,"Video do not exists | cannot like unexisted video");

    const existVideoLike = await Like.exists({video:videoId, likedBy:req.user?._id});
    if(!existVideoLike){
        // create like document : like a video
        const likeResponse = await Like.create({video:videoId,likedBy:req.user?._id});
        if(!likeResponse) throw new ApiError(400,"bad request | Cannot like a video...");

        return res.status(200).json(
            new ApiResponse(200,likeResponse,"Liked a video...")
        )
    }

    // delete like document : undo like
    const undoLikeResponse = await Like.findOneAndDelete({video:videoId, likedBy:req.user?._id});
    if(!undoLikeResponse) throw new ApiError(400,"bad request | Cannot undo like... ")  
    
        return res.status(200).json(
            new ApiResponse(200,{},"Unliked a video")
        )

    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const commentId = req.params?.commentId;

    if (!commentId)
        throw new ApiError(400, "Comment id is required.");

    if (!mongoose.Types.ObjectId.isValid(commentId))
        throw new ApiError(400, "Invalid comment id.");

    const commentExists = await Comment.exists({ _id: commentId });

    if (!commentExists)
        throw new ApiError(404, "Comment does not exist.");

    const existingLike = await Like.exists({
        comment: commentId,
        likedBy: req.user._id
    });

    if (!existingLike) {
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });

        return res.status(200).json(
            new ApiResponse(200, like, "Comment liked successfully.")
        );
    }

    await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment unliked successfully.")
    );
});

export { toggleVidoeLike, toggleCommentLike }