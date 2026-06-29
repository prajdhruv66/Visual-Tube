import asyncHandler from "../utils/asyncHandler.js";   
import {ApiError} from '../utils/apiErrors.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'

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
    if(existUser) throw new ApiError(409,"user already exists")

    // 4. check for images for avatar through multer and check for avatar
    
    const avatarPath = req.files?.avatar?.[0]?.path // multer middleware(upload) adds additional fields to req like files
    console.log(req.files)
    const coverImagePath = req.files?.coverImage?.[0]?.path

    if(!avatarPath) throw new ApiError(400,"avatar must be uploaded")

    // 5. upload avatar in cloudinary 
    const avatar = await uploadOnCloudinary(avatarPath)
    const coverImage = coverImagePath ? await uploadOnCloudinary(coverImagePath) : null

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
        return res.status(201).json(
            new ApiResponse(201,createdUser,"User registered successfully !")
        )
    }
})

const generateAccessAndRefreshTokens = async (userId)=>{
    //  generate access token and refresh token and save refresh tokens to db
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefershToken()

        // save() updates the user document in MongoDB.
        // validateBeforeSave: false skips schema validation before saving,
        // useful when updating only specific fields like refreshToken. 
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) 

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating tokens")
    }
}

const login = asyncHandler(async(req,res)=>{
    // 1. take data from req.body
    const { email, username, password} = req.body

    // 2. check if required fields are there
    if(!email || !username || !password) {
        throw new ApiError(400,"email, username and password are all required")
    }

    //3. check if user already exist
    const user = await User.findOne({
        email: email,
        username: username
    })
    if(!user) throw new ApiError(404,"please register first to login")

    // 4. do password validation
    // note: Mongoose Schema Instance Method are used with document instance (a single record from MongoDB), not on the model itself.
    const isValidPassword = await user.isPasswordCorrect(password)
    if(!isValidPassword) throw new ApiError(401," Invalid credentials")

    // 5. get access toke and refresh tokens from predefined function
    const logedInuser = await User.findById(user._id);
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(logedInuser._id);

    // 6. send refresh token and access token to cookie and finally send response
    const option = { // makes cookie unmodifiable and secure
        httpOnly:true,
        secure:true
    }

    // why sending response: for mobile application...
    res.status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user: logedInuser,accessToken,refreshToken
            },
            "User loggedIn successfully..."
        )
    )


})

const logout = asyncHandler(async(req,res)=>{
    // logout will be in protected route by middleware in auth.middleware.js => check if there's access token
    // we will just remove the refresh token from db and access token from req.user to logout

    await User.findByIdAndUpdate(
        req.user?._id,  // find the user document using the user's _id
        {
            $set:{
                refreshToken: undefined
            }
            // update the refreshToken field in the found document
        },

        {
            new:true
            // returns the updated document after applying changes
            // (by default, it returns the old document)
        }
    )

    const option = { // makes cookie unmodifiable and secure
        httpOnly:true,
        secure:true
    }
    return res.status(200).clearCookie("accessToken",option).clearCookie("refreshToken",option)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "User logged Out..."
                )
            )
})

const regenerateTokens = asyncHandler(async(req,res)=>{
    // 1. take refreshToken from req.cookies() or req.body() 
    // 2. check if token exist else throw ApiError()
    // 3. verify refreshToken using jwt and get ._id from decoded
    // 4. get user using refresh token 
    // 5. if no user found, throw ApiError()
    // 6. now apply generateAccessAndRefreshTokens() function to re-gererate both tokens
    // 7. send ApiResponse()

    const clientRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if(!refreshToken) throw new ApiError(401,"Unauthorized access, cannot get refresh token from client side")

    try {
        const decodedToken = jwt.verify(clientRefreshToken,process.env.REFERESH_TOKEN_SECRET)
        if(!decodedToken) throw new ApiError(500,"Unauthorized, Cannot verify refresh token")
        
        const user = await User.findById(decodedToken?._id)
        if(!user) throw new ApiError(401,"Unauthorized acess, refresh token expired.")
    
        if(!(user?.refreshToken === clientRefreshToken)) throw new ApiError(401,"Unauthorized acess, refresh token expired.")
        
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshTokens(decodedToken)
    
        return res.status(200)
                    .json(
                        new ApiResponse(200,
                            {newAccessToken,refreshToken:newRefreshToken},
                            "Tokens refreshed..."
                        )
                    )
    } catch (error) {
        throw new ApiError(500,"Something went wrong while regenerating tokens",error.message)
    }
    
})
export { userRegister , login, logout, regenerateTokens }