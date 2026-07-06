import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import { logMessage, logError } from "../utils/index.js";

// Initialize Cloudinary SDK
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary with folder organization and tags.
 */
export async function uploadAssetToCloudinary(localFilePath, { folder, tags }) {
    try {
        if (!fs.existsSync(localFilePath)) {
            throw new Error(`File does not exist: ${localFilePath}`);
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: folder,
            tags: tags,
        });

        // Always delete the local temporary file after successful upload
        try {
            fs.unlinkSync(localFilePath);
        } catch (_) {}

        return response;
    } catch (err) {
        // Cleanup local file on error as well
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (_) {}
        logError(`❌ Cloudinary upload failed for ${localFilePath}:`, err);
        throw err;
    }
}

/**
 * Extracts the public ID from a Cloudinary URL to support deletes/validations.
 */
export function extractPublicId(url) {
    if (!url || !url.includes("cloudinary.com")) return null;
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    const afterUpload = parts.slice(uploadIndex + 1);
    if (afterUpload[0] && afterUpload[0].startsWith("v") && !isNaN(afterUpload[0].slice(1))) {
        afterUpload.shift();
    }

    const filenameWithExt = afterUpload.pop();
    const filename = filenameWithExt.split(".")[0];
    return [...afterUpload, filename].join("/");
}

/**
 * Deletes a list of assets from Cloudinary in case of a rollback.
 */
export async function rollbackCloudinaryAssets(publicIds) {
    if (!publicIds || publicIds.length === 0) return;
    logMessage(`🔄 Rolling back ${publicIds.length} uploaded Cloudinary assets...`);
    
    const chunkSize = 5;
    for (let i = 0; i < publicIds.length; i += chunkSize) {
        const chunk = publicIds.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (publicId) => {
            try {
                // Determine resource type by folder name or prefix
                const resourceType = publicId.includes("/videos/") ? "video" : "image";
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
                logMessage(`  - Deleted asset from Cloudinary: ${publicId}`);
            } catch (err) {
                logError(`  ⚠ Failed to delete Cloudinary asset: ${publicId}`, err);
            }
        }));
    }
}
