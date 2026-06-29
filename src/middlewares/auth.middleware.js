import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'


// what will verifyJwt will do: will check if access token of user is valid? if yes => allow to 
const verifyJwt = asyncHandler( async (req,_,next)=>{
    try {
        // 1. get access token from cookie (cookie-parser) or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("token", token)

        // 2. check if there's token in cookie or header
        if(!token){ throw new ApiError(400, "Unauthorized request") }
        
        // 3. verify jwt token
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        // 4. get payload from db using decoded token (payload defined in generateAccessToken() in user.model.js)
        const user = await User.findById(decodedToken?._id).select(["-password -refreshToken"])

        // 5. check if user exist and if yes => put it into request body
        if(!user) throw new ApiError(401,"Invalid access token")
        req.user =user
    next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})

export {verifyJwt}