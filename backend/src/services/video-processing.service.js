import fs from "node:fs/promises";
import path from "node:path";

import { Video } from "../models/video.model.js";
import redis from "../config/redis.config.js";

import { downloadVideo } from "../utils/download-video.js";
import { getVideoMetadata } from "../utils/getVideoMetadata.js";
import { generate360p } from "../utils/generate360p.js";
import { generate480p } from "../utils/generate480p.js";
import { generate720p } from "../utils/generate720p.js";
import { generate1080p } from "../utils/generate1080p.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const processVideo = async (job) => {
    const { videoId } = job.data;

    const tempDir = path.join(process.cwd(), "public", "temp", videoId);

    try {
        console.log(`Processing video: ${videoId}`);

        // 1. Find video.
        const video = await Video.findById(videoId);

        if (!video) {
            throw new Error("Video not found.");
        }

        // 2. Mark as processing.
        video.processingStatus = "processing";
        await video.save();

        // Invalidate Redis cache so that the next client fetch receives 'processing' status
        try {
            await redis.del(`video:${videoId}`);
            console.log(`Invalidated cache for video:${videoId} on processing status update`);
        } catch (redisErr) {
            console.error("Failed to invalidate Redis cache on processing status update:", redisErr);
        }

        // Ensure temp directory exists
        await fs.mkdir(tempDir, { recursive: true });

        // 3. Download original video.
        const originalPath = path.join(tempDir, "original.mp4");

        await downloadVideo(
            video.videoFile,
            originalPath
        );

        // 4. Get metadata.
        const metadata = await getVideoMetadata(originalPath);

        console.log("Metadata streams found:", metadata.streams?.length);

        const videoStream = metadata.streams?.find(
            (stream) => stream.codec_type === "video"
        );

        if (!videoStream) {
            throw new Error("No video stream found in metadata.");
        }

        const height = videoStream.height || 0;
        console.log(`Source video height determined: ${height}p`);

        // Determine target resolutions based on height
        const resolutionsToGenerate = [];

        // Always include 360p as the baseline quality
        resolutionsToGenerate.push({
            resolution: "360p",
            generator: generate360p,
            filename: "360p.mp4"
        });

        if (height >= 480) {
            resolutionsToGenerate.push({
                resolution: "480p",
                generator: generate480p,
                filename: "480p.mp4"
            });
        }

        if (height >= 720) {
            resolutionsToGenerate.push({
                resolution: "720p",
                generator: generate720p,
                filename: "720p.mp4"
            });
        }

        if (height >= 1080) {
            resolutionsToGenerate.push({
                resolution: "1080p",
                generator: generate1080p,
                filename: "1080p.mp4"
            });
        }

        console.log(
            `Resolutions to generate: ${resolutionsToGenerate
                .map((r) => r.resolution)
                .join(", ")}`
        );

        const availableResolutions = [];

        // 5. Generate and upload resolutions in ascending order
        for (const target of resolutionsToGenerate) {
            const outputPath = path.join(tempDir, target.filename);

            console.log(`Generating resolution: ${target.resolution}`);
            await target.generator(originalPath, outputPath);

            console.log(`Uploading resolution: ${target.resolution} to Cloudinary`);
            const uploadedVideo = await uploadOnCloudinary(outputPath);

            if (!uploadedVideo || !uploadedVideo.url) {
                throw new Error(
                    `Failed to upload ${target.resolution} to Cloudinary.`
                );
            }

            availableResolutions.push({
                resolution: target.resolution,
                url: uploadedVideo.url,
                public_id: uploadedVideo.public_id
            });
        }

        // 6. Update document resolutions & status.
        video.availableResolutions = availableResolutions;
        video.processingStatus = "published";
        await video.save();

        // 7. Invalidate Redis cache.
        try {
            await redis.del(`video:${videoId}`);
            console.log(`Invalidated cache for video:${videoId}`);
        } catch (redisErr) {
            console.error("Failed to invalidate Redis cache:", redisErr);
        }

        console.log("Video processed and published successfully.");
    } catch (error) {
        console.error(`Error processing video ${videoId}:`, error);

        try {
            await Video.findByIdAndUpdate(
                videoId,
                {
                    processingStatus: "failed"
                }
            );
        } catch (dbError) {
            console.error("Failed to update status to failed in MongoDB:", dbError);
        }

        // Invalidate Redis cache on failure too
        try {
            await redis.del(`video:${videoId}`);
        } catch (redisErr) {
            console.error("Failed to invalidate Redis cache on failure:", redisErr);
        }
    } finally {
        // 8. Cleanup.
        try {
            await fs.rm(tempDir, {
                recursive: true,
                force: true
            });
            console.log(`Cleaned up temporary workspace: ${tempDir}`);
        } catch (cleanupErr) {
            console.error(`Failed to delete tempDir: ${tempDir}`, cleanupErr);
        }
    }
};