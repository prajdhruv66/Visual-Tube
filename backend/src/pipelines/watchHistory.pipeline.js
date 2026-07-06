import mongoose from "mongoose"

const getWatchedHistoryVideosPipeline = ({userId,limit})=>{

    return [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                recentVideoIds: {
                    $reverseArray: {
                        $slice: ["$watchHistory", -limit]
                    }
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "recentVideoIds",
                foreignField: "_id",
                as: "watchedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            _id: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            videoFile: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                watchedVideos: {
                    $map: {
                        input: "$recentVideoIds",
                        as: "id",
                        in: {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: "$watchedVideos",
                                        as: "video",
                                        cond: { $eq: ["$$video._id", "$$id"] }
                                    }
                                },
                                0
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                watchedVideos: 1
            }
        }
    ];
}

export default getWatchedHistoryVideosPipeline;