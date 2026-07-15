import { videoQueue } from "../src/queue/video.queue.js";

await videoQueue.add(
    "process-video",
    {
        videoId: "6a4bed0b197a7eececedf711"
    }
);

console.log("Job added successfully.");
process.exit(0);