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

        const maxRetries = 3;
        let attempt = 0;
        let response;

        while (attempt < maxRetries) {
            try {
                attempt++;
                if (fileSizeInMB > 10) {
                    console.log(`[Attempt ${attempt}/${maxRetries}] File size is ${fileSizeInMB.toFixed(2)}MB (> 10MB). Using upload_large for chunked upload...`);
                    response = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_large(localFilePath, {
                            resource_type: "auto",
                            chunk_size: 5 * 1024 * 1024, // 5MB chunk size (more reliable under unstable network conditions)
                            timeout: 600000 // 10 minutes timeout
                        }, (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                } else {
                    console.log(`[Attempt ${attempt}/${maxRetries}] File size is ${fileSizeInMB.toFixed(2)}MB (<= 10MB). Using standard upload...`);
                    // Uploading file on Cloudinary with standard upload and 10 minutes timeout
                    response = await cloudinary.uploader.upload(localFilePath, {
                        resource_type: "auto",
                        timeout: 600000 // 10 minutes timeout
                    });
                }
                // Break out of the retry loop if successful
                break;
            } catch (error) {
                console.warn(`[Attempt ${attempt}/${maxRetries}] Cloudinary upload attempt failed. Error: ${error.message || error}`);
                
                if (attempt >= maxRetries) {
                    throw error;
                }
                
                // Exponential backoff: 2s, 4s
                const delay = attempt * 2000;
                console.log(`Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        console.log("File has been uploaded to cloudinary \n response:", response.url)
        fs.unlinkSync(localFilePath);
        return response
        
    } catch (error) {
        console.error("Cloudinary upload error after all attempts:", error.message || error);
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