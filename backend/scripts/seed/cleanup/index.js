import { v2 as cloudinary } from "cloudinary";
import { User } from "../../../src/models/user.model.js";
import { Video } from "../../../src/models/video.model.js";
import { Comment } from "../../../src/models/comment.model.js";
import { Like } from "../../../src/models/likes.model.js";
import { Playlist } from "../../../src/models/playlist.model.js";
import { Subscription } from "../../../src/models/subscription.model.js";
import { logMessage, logError } from "../utils/index.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function verifyCloudinary() {
    try {
        const res = await cloudinary.api.ping();
        if (res.status !== "ok") {
            throw new Error("Cloudinary ping status is not 'ok'");
        }
        logMessage("✔ Cloudinary authentication verified successfully.");
    } catch (err) {
        logError("❌ Cloudinary authentication failed:", err);
        throw new Error(`Cloudinary authentication failed: ${err.message}`);
    }
}

export async function clearMongodbCollections() {
    logMessage("🧹 Clearing MongoDB collections in strict dependency order...");
    try {
        // Likes → Comments → Subscriptions → Playlists → Videos → Users
        logMessage("  - Deleting Likes...");
        await Like.deleteMany({});
        
        logMessage("  - Deleting Comments...");
        await Comment.deleteMany({});
        
        logMessage("  - Deleting Subscriptions...");
        await Subscription.deleteMany({});
        
        logMessage("  - Deleting Playlists...");
        await Playlist.deleteMany({});
        
        logMessage("  - Deleting Videos...");
        await Video.deleteMany({});
        
        logMessage("  - Deleting Users...");
        await User.deleteMany({});

        logMessage("✔ MongoDB database collections reset completed.");
    } catch (err) {
        logError("❌ MongoDB reset failed:", err);
        throw new Error(`Database cleanup aborted: ${err.message}`);
    }
}

export async function clearCloudinaryFolder() {
    const prefix = "visual-tube/seed/";
    logMessage(`🧹 Purging Cloudinary folder: ${prefix}...`);
    try {
        // Delete images
        const resImages = await cloudinary.api.delete_resources_by_prefix(prefix, {
            resource_type: "image",
            invalidate: true,
        });
        logMessage(`  - Deleted images list: ${JSON.stringify(resImages.deleted)}`);

        // Delete videos
        const resVideos = await cloudinary.api.delete_resources_by_prefix(prefix, {
            resource_type: "video",
            invalidate: true,
        });
        logMessage(`  - Deleted videos list: ${JSON.stringify(resVideos.deleted)}`);

        // Delete subfolders
        const folders = [
            "visual-tube/seed/avatars",
            "visual-tube/seed/covers",
            "visual-tube/seed/thumbnails",
            "visual-tube/seed/videos",
            "visual-tube/seed"
        ];

        for (const folder of folders) {
            try {
                await cloudinary.api.delete_folder(folder);
                logMessage(`  - Deleted Cloudinary folder: ${folder}`);
            } catch (err) {
                if (err.error?.http_code !== 404) {
                    logMessage(`  ⚠ Warning: Could not delete Cloudinary folder ${folder} (${err.message})`);
                }
            }
        }
        logMessage("✔ Cloudinary seed folder purged successfully.");
    } catch (err) {
        logError("❌ Cloudinary purge failed:", err);
        throw new Error(`Cloudinary cleanup failed: ${err.message}`);
    }
}
