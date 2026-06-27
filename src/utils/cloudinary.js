import {v2 as cloudinary} from 'cloudinary'
import fs from 'node:fs';

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null

        //upoading file on cloudinary from public temp
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("File has been uploaded to cloudinary \n response:",response.url)
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // unlink or delete files as failed to upload and in sync way as we don't wanna move forward without delete
        return null;
    }
}

export {uploadOnCloudinary}