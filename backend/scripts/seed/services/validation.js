import { v2 as cloudinary } from "cloudinary";
import { User } from "../../../src/models/user.model.js";
import { Video } from "../../../src/models/video.model.js";
import { extractPublicId } from "./cloudinary.js";
import { logMessage, logError } from "../utils/index.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getCloudinaryPublicIds() {
    const publicIds = new Set();
    const prefix = "visual-tube/seed/";
    
    // Images
    let hasMore = true;
    let nextCursor = null;
    while (hasMore) {
        const options = { type: "upload", prefix, resource_type: "image", max_results: 500 };
        if (nextCursor) options.next_cursor = nextCursor;
        const res = await cloudinary.api.resources(options);
        (res.resources || []).forEach(r => publicIds.add(r.public_id));
        nextCursor = res.next_cursor;
        hasMore = !!nextCursor;
    }

    // Videos
    hasMore = true;
    nextCursor = null;
    while (hasMore) {
        const options = { type: "upload", prefix, resource_type: "video", max_results: 500 };
        if (nextCursor) options.next_cursor = nextCursor;
        const res = await cloudinary.api.resources(options);
        (res.resources || []).forEach(r => publicIds.add(r.public_id));
        nextCursor = res.next_cursor;
        hasMore = !!nextCursor;
    }

    return publicIds;
}

export async function validateIntegrity(currentRunPublicIds) {
    logMessage("🔍 Starting referential integrity validation...");
    const errors = [];
    const dbPublicIds = new Set();

    try {
        const cloudinaryPublicIds = await getCloudinaryPublicIds();
        logMessage(`Registered ${cloudinaryPublicIds.size} assets inside visual-tube/seed/ on Cloudinary.`);

        const users = await User.find({}).select("username avatar coverImage");
        const videos = await Video.find({}).select("title thumbnail videoFile");

        // Verify users
        users.forEach((user) => {
            if (user.avatar) {
                const id = extractPublicId(user.avatar);
                if (!id) {
                    errors.push(`User ${user.username} has invalid avatar URL: ${user.avatar}`);
                } else {
                    dbPublicIds.add(id);
                    if (!cloudinaryPublicIds.has(id)) {
                        errors.push(`User ${user.username} avatar does not exist on Cloudinary: ${id}`);
                    }
                }
            }
            if (user.coverImage) {
                const id = extractPublicId(user.coverImage);
                if (!id) {
                    errors.push(`User ${user.username} has invalid coverImage URL: ${user.coverImage}`);
                } else {
                    dbPublicIds.add(id);
                    if (!cloudinaryPublicIds.has(id)) {
                        errors.push(`User ${user.username} coverImage does not exist on Cloudinary: ${id}`);
                    }
                }
            }
        });

        // Verify videos
        videos.forEach((video) => {
            if (video.thumbnail) {
                const id = extractPublicId(video.thumbnail);
                if (!id) {
                    errors.push(`Video "${video.title}" has invalid thumbnail URL: ${video.thumbnail}`);
                } else {
                    dbPublicIds.add(id);
                    if (!cloudinaryPublicIds.has(id)) {
                        errors.push(`Video "${video.title}" thumbnail does not exist on Cloudinary: ${id}`);
                    }
                }
            }
            if (video.videoFile) {
                const id = extractPublicId(video.videoFile);
                if (!id) {
                    errors.push(`Video "${video.title}" has invalid videoFile URL: ${video.videoFile}`);
                } else {
                    dbPublicIds.add(id);
                    if (!cloudinaryPublicIds.has(id)) {
                        errors.push(`Video "${video.title}" videoFile does not exist on Cloudinary: ${id}`);
                    }
                }
            }
        });

        // Detect orphans (files on Cloudinary that are NOT referenced in MongoDB)
        cloudinaryPublicIds.forEach((id) => {
            if (!dbPublicIds.has(id)) {
                errors.push(`Orphaned Cloudinary seed asset found: ${id}`);
            }
        });

        // Verify current run uploads are all represented on Cloudinary
        currentRunPublicIds.forEach((id) => {
            if (!cloudinaryPublicIds.has(id)) {
                errors.push(`Uploaded asset from current execution missing on Cloudinary: ${id}`);
            }
        });

        if (errors.length > 0) {
            logError(`❌ Integrity validation failed with ${errors.length} error(s).`, null);
            errors.forEach(e => console.error(`  - ${e}`));
            throw new Error(`Referential validation check failed with ${errors.length} error(s).`);
        }

        logMessage("✔ Database referential integrity check completed successfully. 100% synchronized.");
    } catch (err) {
        logError("❌ Validation failed:", err);
        throw err;
    }
}
