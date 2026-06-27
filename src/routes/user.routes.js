import { Router } from "express";
import { userRegister } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router()

userRouter.route('/register').post(
    // multer instance is used as middleware and .fields helps to upload multiple files with different fieldNames
    upload.fields([
        {
            name:"avatar",
            maxCount : 1
        }
    ])    
    ,userRegister)

export default userRouter