import {v2 as cloudinary} from 'cloudinary'
import fs from 'node:fs';
import { ApiError } from './apiErrors.js';

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
        fs.unlinkSync(localFilePath);
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // unlink or delete files as failed to upload and in sync way as we don't wanna move forward without delete
        return null;
    }
}

const deleteFromCloudinary = async (publicUrl)=>{
    try {
        if(!publicUrl) throw new ApiError(400,"Cannot get file's public url to delete")

        const response = await cloudinary.uploader.destroy(publicUrl, 
        {
        invalidate: true
        })
        console.log("response while deteting file: ",response)
        return response
    } catch (error) {
        throw new ApiError(500,error.message)
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}