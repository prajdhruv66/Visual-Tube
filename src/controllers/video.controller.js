import { Video } from "../models/video.model";
import { ApiError } from "../utils/apiErrors";
import { ApiResponse } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";

const uploadVideo = asyncHandler(async(req,res)=>{

    // 1. Get video and thumbnail files from multer
    const video = req.files?.video?.[0]
    const thumbnail = req.files?.thumbnail?.[0]

    // 2. Get video details from request body
    const {title,description,tags,isPublished} = req.body

    // 3. Validate required fields
    if(!title?.trim() || !description?.trim() || !tags || isPublished)
        throw new ApiError(400,"Required fields missing")

    // 4. Validate uploaded files
    if(!video?.path || !thumbnail?.path)
        throw new ApiError(400,"Video and thumbnail are required")

    // 5. Store cloudinary response for cleanup if any step fails
    let savedVideo = null
    let savedThumbnail = null

    try{

        // 6. Upload video and thumbnail to Cloudinary
        savedVideo = await uploadOnCloudinary(video.path)
        savedThumbnail = await uploadOnCloudinary(thumbnail.path)

        // 7. Check Cloudinary upload success
        if(!savedVideo || !savedThumbnail)
            throw new ApiError(500,"Cloudinary upload failed")

        // 8. Create video document in database
        const finalVideo = await Video.create({
            title,
            description,
            tags,
            isPublished,
            duration:savedVideo.duration,
            owner:req.user._id,
            videoFile:savedVideo.url,
            thumbnail:savedThumbnail.url
        })

        // 9. Check database creation
        if(!finalVideo)
            throw new ApiError(500,"Cannot store video information")

        // 10. Fetch created video with owner details
        const response = await Video.findById(finalVideo._id)
            .populate("owner","username avatar")

        // 11. Return uploaded video response
        return res.status(201).json(
            new ApiResponse(
                201,
                response,
                "Video uploaded successfully"
            )
        )

    }catch(error){

        // 12. Delete already uploaded files if database/cloudinary process fails
        const video_publicId = savedVideo.split("/").pop().split(".")[0]
        const thumbnail_publicId = thumbnail.split("/").pop().split(".")[0]
        if(video_publicId)
            await deleteFromCloudinary(savedVideo.public_id)

        if(thumbnail_publicId)
            await deleteFromCloudinary(savedThumbnail.public_id)

        throw new ApiError(500,"Something went wrong while uploading video")
    }
})

const getVideoById = asyncHandler(async(req,res)=>{
     
})

export {uploadVideo,getVideoById}