const getAllVideoPipeline = ({
    limit=10,
    page,
    search,
    mode
})=>{
    let paginateStage=        
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

    let pipeline=[
        {   // get all publiced video first
            $match:{ isPublished: true,
                ...(search && {
                $text: {
                    $search: search
                }
             })
            }
        },
        {   // get owner details || subscriberCount, username, avatar
            $lookup:{ 
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
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
        {   // unwind(unarray) owner
            $unwind:'$owner'
        },
        {   // lookup to get likeCounts
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"videoLikes"
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
        }
    ];


    if(search){

        // add score field => later used to sort by textscore
        pipeline.push({
            $addFields: {
                score: {
                    $meta: "textScore"
                }
            }
        });

        // add sorting
        pipeline.push({$sort:{
            score:-1,
            views:-1
        }})
    }
    else if(mode === "trending"){
        pipeline.push({
            $sort:{ views:-1 }
        });
    }
    else {
        pipeline.push({
            $sort:{ createdAt:-1 }
        });
    }

    pipeline.push(paginateStage)

    return pipeline
 
}


export { getAllVideoPipeline }