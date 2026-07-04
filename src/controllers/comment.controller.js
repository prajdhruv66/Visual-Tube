import mongoose from "mongoose";
import { ApiError } from "../utils/apiErrors";
import asyncHandler from "../utils/asyncHandler";
import {Comment} from '../models/comment.model.js';
import { ApiResponse } from "../utils/apiResponse";
import { Video } from "../models/video.model.js";

const addComment = asyncHandler(async(req,res)=>{

    const content = req.body?.content?.trim();
    if(!content) throw new ApiError(400,"Comment field required");

    const videoId = req.params?.videoId;
    if(!videoId) throw new ApiError(400,"Video Id is required");
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"Invalid mongoose id...");

    const videoExists = await Video.exists({ _id: videoId }); // slightly effiecent wrt. findById() | returns only _id
    if (!videoExists) throw new ApiError(404, "Video not found");

    const owner = req.user?._id 
    if(!owner) throw new ApiError(400,"Owner is required | user is unauthenticated")

    const addedComment = await Comment.create({content,video:videoId,owner})

    if(!addedComment) throw new ApiError(500,"Couldn't add comment");

    return res.status(201).json(
        new ApiResponse(201,addedComment,"Comment added successfully... !")
    )

})

const deleteComment = asyncHandler(async(req,res)=>{
    const idFromClient = req.params?.commentId;
    if(!idFromClient) throw new ApiError(400,"Comment Id requried");
    if(!mongoose.Types.ObjectId.isValid(idFromClient)) throw new ApiError(400,"Invalid comment Id");

    const deleteResponse = await Comment.findOneAndDelete({_id:idFromClient, owner:req.user?._id});
    if(!deleteResponse) throw new ApiError(404,"Comment not found to delete");

    return res.status(200).json(
        new ApiResponse(200,deleteResponse,"Comment deleted Successfully... !")
    )
})

const editComment = asyncHandler(async(req,res)=>{

    const content = req.body?.content?.trim();
    if(!content) throw new ApiError(400,"Comment field required");

    const idFromClient = req.params?.commentId;
    if(!idFromClient) throw new ApiError(400,"Comment Id requried");
    if(!mongoose.Types.ObjectId.isValid(idFromClient)) throw new ApiError(400,"Invalid comment Id");

    const editResponse = await Comment.findOneAndUpdate({ _id:idFromClient, owner:req.user?._id},{content},{returnDocument:'after'});
    if(!editResponse) throw new ApiError(404,"Comment not found to edit");

    return res.status(200).json(
        new ApiResponse(200,editResponse,"comment edit successfull... !")
    );
})

const getVideoComments = asyncHandler(async(req,res)=>{
    const videoId = req.params?.videoId?.trim()
    if(!videoId) throw new ApiError(400,"VideoId is required");
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"Invalid mongodb id...");

    const existVideo = await Video.exists({_id:videoId});
    if(!existVideo) throw new ApiError(404,"Cannot find video");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
        Math.max(Number(req.query.limit) || 20, 1),
        100
    );    
    
    const comments = await Comment.aggregate([
        {
            $match:{video:existVideo._id}
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'commentOwner',
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
            $unwind:'$commentOwner'
        },
        {
            $lookup:{
                from:'likes',
                localField:'_id',
                foreignField:'comment',
                as:'commentLikes'
            }
        },
        {
            $addFields:{likeCounts:{$size:'$commentLikes'}}
        },
        {
            $project:{
                _id:1,
                content:1,
                createdAt:1,
                username:'$commentOwner.username',
                avatar:'$commentOwner.avatar',
                likeCounts:1
            }
        },
        {
            $sort:{likeCounts:-1,createdAt:-1}
        },
        {   // for pagination
            $facet:{ 
                metadata :[
                    {
                    $count: "totalComments"
                    }
                ],
                comments:[
                    {
                        $skip: (page-1)*limit
                    },
                    {
                        $limit: limit
                    }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200,comments[0],"Comments fetched sucessfully !")
    )
})

export { addComment, deleteComment, editComment, getVideoComments}