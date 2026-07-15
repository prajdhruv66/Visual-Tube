import { Worker } from "bullmq";
import { bullConnection } from "../config/bullmq.config.js";
import { processVideo } from "../services/video-processing.service.js";

const videoWorker = new Worker(
    'video-processing',
    async(job)=>{
        await processVideo(job)
    },
    {
        connection:bullConnection
    }
)

videoWorker.on("ready", () => {
    console.log("Video Worker Ready");
});

videoWorker.on("error", (error) => {
    console.log(error);
});

videoWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed.`);
});

videoWorker.on("failed", async (job, error) => {
    console.log(`Job ${job?.id} failed.`);
    console.log(error);
    if (job?.data?.videoId) {
        try {
            const { Video } = await import("../models/video.model.js");
            const redis = (await import("../config/redis.config.js")).default;
            await Video.findByIdAndUpdate(job.data.videoId, { processingStatus: "failed" });
            await redis.del(`video:${job.data.videoId}`);
            console.log(`Marked video ${job.data.videoId} as failed on job failure.`);
        } catch (err) {
            console.error("Failed to update video status to failed on worker event failure:", err);
        }
    }
});