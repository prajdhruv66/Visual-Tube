import { Router } from "express";
import { login,
    userRegister,
    logout,
    regenerateTokens,
    updateAccountDetail,
    updateAvatar,
    updateCoverImage, 
    getUser,
    getUserChannelProfile,
    getWatchHistory
 } from "../controllers/user.controller.js";
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
userRouter.route("/me").patch(verifyJwt,updateAccountDetail)
userRouter.route("/avatar").patch(verifyJwt,upload.single("avatar"), updateAvatar )
userRouter.route("/cover-image").patch(verifyJwt,upload.single("coverImage"), updateCoverImage )
userRouter.route("/me").get(verifyJwt,getUser)
userRouter.route("/c/:username").get(verifyJwt,getUserChannelProfile)
userRouter.route("/history").get(verifyJwt,getWatchHistory)

export default userRouter