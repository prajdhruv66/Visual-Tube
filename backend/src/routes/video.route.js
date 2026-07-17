import { Router } from "express";  
import { upload } from "../middlewares/multer.middleware.js"; 
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { uploadVideo, 
        getVideoById, 
        watchVideo, 
        updateThumbnail,
        updateVideoDetial,
        toggleIsPublish,
        deleteVideo,
        getVideoFeed,
        getPersonalisedVideos,
        getVideoLikes
        } from "../controllers/video.controller.js";

const videoRouter = Router()

videoRouter.route('/').post(
            verifyJwt,
            rateLimiter('upload', 5, 3600), // max 5 uploads per hour
            upload.fields([{name:'video',maxCount:1}, {name:'thumbnail',maxCount:1}]),
            uploadVideo)

videoRouter.route('/get-feed').get(verifyJwt,getVideoFeed)
videoRouter.route('/personalised').get(verifyJwt,getPersonalisedVideos)

videoRouter.route('/:videoId').get(verifyJwt,getVideoById)
                              .patch(verifyJwt,updateVideoDetial)  
                              .delete(verifyJwt,deleteVideo);
 
videoRouter.route('/:videoId/thumbnail').patch(verifyJwt,upload.single("thumbnail"),updateThumbnail);
videoRouter.route('/:videoId/watch').post(verifyJwt,watchVideo);
videoRouter.route('/:videoId/publish').patch(verifyJwt,toggleIsPublish);
videoRouter.route("/:videoId/likes").get(verifyJwt, getVideoLikes);

export default videoRouter