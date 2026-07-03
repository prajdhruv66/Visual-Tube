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
        getWatchHistory
        } from "../controllers/video.controller";

const videoRouter = Router()

videoRouter.route('/').post(verifyJwt,
            upload.fields({name:'video',maxCount:1}, {name:'thumbnail',maxCount:1}),
            uploadVideo)

videoRouter.route('/videos/:videoId').get(verifyJwt,getVideoById)
videoRouter.route('/videos/:videoId/watch').post(verifyJwt,watchVideo)
videoRouter.route('/videos/:videoId/thumbnail').patch(verifyJwt,upload.single({name:'thumbnail',maxCount:1}),updateThumbnail)
videoRouter.route('/videos/:videoId').patch(verifyJwt,updateVideoDetial);
videoRouter.route('/videos/:videoId/publish').patch(verifyJwt,toggleIsPublish);
videoRouter.route('/videos/:videoId').delete(verifyJwt,deleteVideo);

videoRouter.route('/video').get(verifyJwt,getVideoFeed)
videoRouter.route('/video/personalised').get(verifyJwt,getPersonalisedVideos)
videoRouter.route('/video/history').get(verifyJwt,getWatchHistory)

