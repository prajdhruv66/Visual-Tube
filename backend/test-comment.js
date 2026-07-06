import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Comment } from './src/models/comment.model.js';
import { Video } from './src/models/video.model.js';
import { User } from './src/models/user.model.js';

dotenv.config({ path: './.env' });

async function run() {
    try {
        console.log("Connecting to DB: " + process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected!");

        const user = await User.findOne();
        const video = await Video.findOne();

        if (!user || !video) {
            console.log("User or video not found in DB.");
            process.exit(1);
        }

        console.log(`Testing comment creation for user ${user._id} on video ${video._id}`);

        const comment = new Comment({
            content: "Test comment content " + Date.now(),
            video: video._id,
            owner: user._id
        });

        await comment.validate();
        console.log("Validation passed!");

        await comment.save();
        console.log("Save passed!");

        // Populate like getCommentById
        const commentWithDetails = await Comment.findById(comment._id)
            .populate("owner", "username avatar fullname");

        console.log("Populated comment:", JSON.stringify(commentWithDetails, null, 2));

    } catch (err) {
        console.error("Error encountered:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
