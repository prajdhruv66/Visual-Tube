import asyncHandler from "../utils/asyncHandler.js";   
import {ApiError} from '../utils/apiErrors.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'
const userRegister = asyncHandler(async(req,res)=>{
    // 1. get user details of user from frontend
    // 2. validate - not empty fields
    // 3. check if user already exists: via username or email
    // 4. get coverImage path and avatarPath and check for nonempty avatar
    // 5. upload avatar in cloudinary and once again check for avatar upload
    // 6. create user object to upload it to db
    // 7. create response: remove uncessary fields like password and refresh tokens
    // 8. if user created successfully - send response | else give apiError

    // 1. get user details of user from frontend
    const {fullname,email,username,password} = req.body

    // 2. validate - not empty fields
    if(
        [fullname,email,username,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    }

    // 3. check if user already exists: via username or email
    const existUser = await User.findOne({
        $or:[{email},{username}] // $operator is used for or/and/nor operation
    })
    if(!existUser) throw new ApiError(409,"user already exists")

    // 4. check for images for avatar through multer and check for avatar
    
    const avatarPath = req.files?.avtar[0].path // multer middleware(upload) adds addtional feilds to req like files
    console.log(req.files)
    const coverImagePath = req.files?.coverImage[0].path

    if(!avatarPath) throw new ApiError(400,"avatar must be uploaded")

    // 5. upload avatar in cloudinary 
    const avatar = await uploadOnCloudinary(avatarPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    if(!avatar) throw new ApiError(400,"avatar file is requried")

    // 6. create user object to upload it to db
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    // 7. create response: remove uncessary fields like password and refresh tokens

    //.select() "-password" is used to diselect password and similarly for refreshToken
    const createdUser = await User.findOne(user._id).select([
        "-password -refreshToken"
    ]) 
    if(createdUser) {
        return res.status(200).json(
            new ApiResponse(200,createdUser,"User registered successfully !")
        )
    }
})

export {userRegister}