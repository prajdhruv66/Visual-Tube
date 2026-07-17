import {v2 as cloudinary} from 'cloudinary'
import fs from 'node:fs';
import { ApiError } from './apiErrors.js';

// Validate Cloudinary configuration
const CLOUDINARY_CONFIG = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};

if (!CLOUDINARY_CONFIG.cloud_name || !CLOUDINARY_CONFIG.api_key || !CLOUDINARY_CONFIG.api_secret) {
    console.warn('WARNING: Cloudinary credentials are missing or incomplete');
}

cloudinary.config(CLOUDINARY_CONFIG)

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null

        // Check file size using fs.statSync
        const stats = fs.statSync(localFilePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

        let response;
        if (fileSizeInMB > 10) {
            console.log(`File size is ${fileSizeInMB.toFixed(2)}MB (> 10MB). Using upload_large for chunked upload...`);
            response = await cloudinary.uploader.upload_large(localFilePath, {
                resource_type: "auto",
                chunk_size: 10 * 1024 * 1024, // 10MB chunk size
                timeout: 600000 // 10 minutes timeout
            });
        } else {
            console.log(`File size is ${fileSizeInMB.toFixed(2)}MB (<= 10MB). Using standard upload...`);
            // Uploading file on Cloudinary with standard upload and 10 minutes timeout
            response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto",
                timeout: 600000 // 10 minutes timeout
            });
        }

        console.log("File has been uploaded to cloudinary \n response:", response.url)
        fs.unlinkSync(localFilePath);
        return response
        
    } catch (error) {
        console.error("Cloudinary upload error:", error.message || error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath) // Delete local file on failure
        }
        throw error;
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