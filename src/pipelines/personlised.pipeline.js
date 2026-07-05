const recommendedPipeline = ({
    page,
    limit,
    extractedTags,
    watchedVideoIds
})=>{
    const pipeline= [
        {
            $match:{isPublished:true}
        },
        {
            $match:{
                tags:{$in : extractedTags},
                _id:{$nin : watchedVideoIds}
            }
        },
        {   // owner details, likecounts etc
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {$lookup:{ // to get subscriber count
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                    }},
                    {$addFields:{
                            subscriberCount:{$size: '$subscribers'},
                    }},
                    {$project:{
                        username:1,
                        avatar:1,
                        subscriberCount:1,
                    }}
                ]
            }
        },

        {   // unarray owner
            $unwind:'$owner'
        },

        {   // lookup into like schema to get LikeCounts
            $lookup:{
                from:'likes',
                localField:'_id',
                foreignField:'video',
                as:'videoLikes'
            }
        },

        {   // add LikeCount
            $addFields:{
                likeCount:{$size:'$videoLikes'}
            }
        },

        {    // add projection
            $project: {
                    _id:1,
                    title: 1,              // Video title
                    description:1,         // description
                    thumbnail: 1,          // Thumbnail URL
                    duration: 1,           // Video duration
                    views: 1,              // View count
                    createdAt: 1,          // Upload date
                    likeCount: 1,          //likeCount
                    owner: 1               // username, avatar, subscriberCount and description
                    }
        },

        {   // sorting based on views | createdAt
            $sort:{views:-1, createdAt:-1}
        },

        {   // for pagination
            $facet:{ 
                metadata :[
                    {
                    $count: "totalVideos"
                    }
                ],
                videos:[
                    {
                        $skip: (page-1)*limit
                    },
                    {
                        $limit: limit
                    }
                ]
            }
        }

    ];
    return pipeline
}

export default recommendedPipeline