import { Subscription } from "../models/subscription.model";
import { ApiError } from "../utils/apiErrors";
import { ApiResponse } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import mongoose from "mongoose";

const toggleSubscribe = asyncHandler(async(req,res)=>{

    // 1. Get current logged-in user id from req.user
    //    This user will become the "subscriber" in Subscription model
    const userId = req.user?._id


    // 2. Get channel id from request params
    //    This is the channel on which subscribe/unsubscribe action will happen
    const {channelId} = req.params


    // 3. Validate required data
    //    If user is not logged in OR channel id is missing, stop execution
    if(!userId || !channelId)
        throw new ApiError(400,"Channel doesn't exist or user is logged out")


    // 4. Prevent user from subscribing to their own channel
    //    A user cannot create subscription relationship with themselves
    if(userId.toString() === channelId.toString())
        throw new ApiError(400,"You cannot subscribe to your own channel")


    // 5. Check if subscription document already exists
    //    In Subscription model:
    //    subscriber: A && channel: B
    //    means A is subscribed to B
    const existingSubscription = await Subscription.findOne({
        subscriber:userId,
        channel:channelId
    })


    // 6. If subscription document exists
    //    User is already subscribed
    //    So remove that document to unsubscribe
    if(existingSubscription){

        const unsubscribe = await Subscription.findOneAndDelete({
            subscriber:userId,
            channel:channelId
        })


        if(!unsubscribe)
            throw new ApiError(500,"Couldn't unsubscribe from channel")


        // 7. Return updated subscription state
        //    false means current user is no longer subscribed
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    isSubscribed:false
                },
                "Unsubscribed successfully"
            )
        )

    }


    // 8. If subscription document does not exist
    //    User is not subscribed
    //    Create new subscription document
    const subscribe = await Subscription.create({
        subscriber:userId,
        channel:channelId
    })


    if(!subscribe)
        throw new ApiError(500,"Couldn't subscribe to channel")


    // 9. Return updated subscription state
    //    true means current user is now subscribed
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isSubscribed:true
            },
            "Subscribed successfully"
        )
    )

})

const getSubscribedChannel = asyncHandler(async(req,res)=>{

    // 1. Get all channels subscribed by current logged-in user
    //    Subscription model stores relationship:
    //    {
    //       subscriber: User A,
    //       channel: User B
    //    }
    //
    //    Meaning:
    //    User A has subscribed to User B's channel

    const channels = await Subscription.aggregate([
        // 2. Find subscription documents where current user is subscriber
        //    We convert string id into ObjectId because MongoDB stores references as ObjectId
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(req.user._id)
            }
        },
    
        // 3. Get channel owner details from User collection
        //
        //    Subscription has only:
        //    channel: ObjectId
        //
        //    We use $lookup to get:
        //    username, avatar, etc. from User collection
        {
            $lookup:{
                from:"users",
                // Subscription.channel
                localField:"channel",
                // User._id
                foreignField:"_id",
                as:"channelAsUser",

                // 4. Pipeline inside User lookup
                //    Here we are working on the channel owner's User document
                pipeline:[

                    // 5. Find all subscribers of this channel
                    //
                    //    User._id
                    //          |
                    //          ↓
                    //    Subscription.channel
                    //
                    //    This gives all users who subscribed to this channel
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribers"
                        }
                    },


                    // 6. Calculate channel statistics
                    //
                    //    subscribers is an array:
                    //
                    //    [
                    //      {subscriber:A, channel:B},
                    //      {subscriber:C, channel:B}
                    //    ]
                    //
                    //    $size gives number of subscribers
                    {
                        $addFields:{
                            subscriberCount:{
                                $size:"$subscribers"
                            }
                        }
                    },


                    // 7. Return only required channel fields
                    //    Remove unnecessary User fields
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            subscriberCount:1
                        }
                    }
                ]
            }
        },


        // 8. $lookup always returns an array
        //
        //    Before:
        //    channelAsUser:[
        //        {username:"abc"}
        //    ]
        //
        //    After:
        //    channelAsUser:{
        //        username:"abc"
        //    }
        {
            $unwind:"$channelAsUser"
        },


        // 9. Shape final API response
        //
        //    Create cleaner output:
        //
        //    {
        //       channel:{
        //          username,
        //          avatar,
        //          subscriberCount
        //       }
        //    }
        {
            $project:{
                _id:0,
                channel:"$channelAsUser"
            }
        }

    ])


    // 10. If no subscribed channels found
    if(!channels.length)
        throw new ApiError(
            404,
            "Cannot find subscribed channels"
        )

    // 11. Send final response
    return res.status(200).json(

        new ApiResponse(
            200,
            channels,
            "Channels fetched successfully!"
        )

    )

})


export {toggleSubscribe, getSubscribedChannel}