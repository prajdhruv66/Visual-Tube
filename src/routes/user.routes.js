import { Router } from "express";
import { login, userRegister, logout, regenerateTokens } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

console.log("USER ROUTER LOADED")
const userRouter = Router()

userRouter.route('/register').post(
    // multer instance is used as middleware and .fields helps to upload multiple files with different fieldNames
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userRegister)

userRouter.route('/login').post(login)

//secured routes
userRouter.route("/logout").post(verifyJwt,  logout)
userRouter.route("/regenerate-tokens").post(regenerateTokens)

export default userRouter