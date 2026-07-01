import { Router } from "express";  
import { upload } from "../middlewares/multer.middleware"; 
import { verifyJwt } from "../middlewares/auth.middleware";
import { uploadVideo } from "../controllers/video.controller";

const videoRouter = Router()

videoRouter.route('/upload-video').post(verifyJwt,
            upload.fields({name:'video',maxCount:1}, {name:'thumbnail',maxCount:1}),
            uploadVideo)



