import { Router } from "express";  
import { upload } from "../middlewares/multer.middleware"; 
import { verifyJwt } from "../middlewares/auth.middleware";
import { uploadVideo, 
        getVideoById, 
        watchVideo, 
        updateThumbnail,
        updateVideoDetial,
        toggleIsPublish,
        deleteVideo,
        getVideoFeed,
        getPersonalisedVideos,
        getWatchHistory,
        getVideoLikes
        } from "../controllers/video.controller";

const videoRouter = Router()

videoRouter.route('/').post(verifyJwt,
            upload.fields({name:'video',maxCount:1}, {name:'thumbnail',maxCount:1}),
            uploadVideo)

videoRouter.route('/:videoId').get(verifyJwt,getVideoById)
videoRouter.route('/:videoId/watch').post(verifyJwt,watchVideo)
videoRouter.route('/:videoId/thumbnail').patch(verifyJwt,upload.single({name:'thumbnail',maxCount:1}),updateThumbnail)
videoRouter.route('/:videoId').patch(verifyJwt,updateVideoDetial);
videoRouter.route('/:videoId/publish').patch(verifyJwt,toggleIsPublish);
videoRouter.route('/:videoId').delete(verifyJwt,deleteVideo);

videoRouter.route('/').get(verifyJwt,getVideoFeed)
videoRouter.route('/personalised').get(verifyJwt,getPersonalisedVideos)
videoRouter.route('/history').get(verifyJwt,getWatchHistory)
videoRouter.route("/:videoId/likes").get(verifyJwt, getVideoLikes);

export default videoRouter