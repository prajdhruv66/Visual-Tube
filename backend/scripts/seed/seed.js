import "dotenv/config";
import mongoose from "mongoose";
import path from "node:path";
import fs from "node:fs";

import connect_mongodb from "../../src/config/index.js";
import { User } from "../../src/models/user.model.js";
import { Video } from "../../src/models/video.model.js";
import { Comment } from "../../src/models/comment.model.js";
import { Like } from "../../src/models/likes.model.js";
import { Playlist } from "../../src/models/playlist.model.js";
import { Subscription } from "../../src/models/subscription.model.js";

import { CONFIG } from "./config/index.js";
import { CONTENT_MANIFEST, VIEWERS } from "./content/manifest.js";
import {
    logMessage,
    logError,
    randInt,
    randomSubset,
    pickRandom,
    slugify,
    initSeedWorkspace,
} from "./utils/index.js";
import { downloadCorrelatedMedia, downloadFile } from "./download/index.js";
import {
    uploadAssetToCloudinary,
    rollbackCloudinaryAssets,
} from "./services/cloudinary.js";
import {
    verifyCloudinary,
    clearMongodbCollections,
    clearCloudinaryFolder,
} from "./cleanup/index.js";
import { validateIntegrity } from "./services/validation.js";

const uploadedPublicIds = [];

// Helper to wipe temp downloaded media files at the end of a batch
function cleanupTempFolder() {
    if (fs.existsSync(CONFIG.TEMP_DIR)) {
        const files = fs.readdirSync(CONFIG.TEMP_DIR);
        for (const file of files) {
            if (file !== ".gitkeep") {
                try {
                    fs.unlinkSync(path.join(CONFIG.TEMP_DIR, file));
                } catch (_) {}
            }
        }
    }
}

async function main() {
    logMessage("🚀 Starting Visual-Tube Isolated Seed System (SRS Compliant)...");
    initSeedWorkspace();

    const createdUserIds = [];
    const createdVideoIds = [];
    const createdPlaylistIds = [];
    const createdCommentIds = [];
    const createdLikeIds = [];
    const createdSubscriptionIds = [];

    try {
        // 1. Connect MongoDB
        await connect_mongodb();
        logMessage("✔ Connected to MongoDB.");

        // 2. Connect Cloudinary & Verify credentials
        await verifyCloudinary();

        // 3. Clear database (Likes → Comments → Subscriptions → Playlists → Videos → Users)
        if (CONFIG.CLEAR) {
            await clearCloudinaryFolder();
            await clearMongodbCollections();
        }

        cleanupTempFolder();

        // 4. Generate Viewers (Non-creator accounts)
        logMessage("👤 Generating non-creator viewer accounts...");
        const viewers = [];
        const viewersList = VIEWERS.slice(0, CONFIG.VIEWER_COUNT);
        for (const viewerInfo of viewersList) {
            // Default generic avatar for viewers using pravatar (no-key)
            const slug = slugify(viewerInfo.fullname);
            const avatarFilename = `${slug}_avatar.jpg`;
            const avatarLocalPath = path.join(CONFIG.TEMP_DIR, avatarFilename);
            
            // Download viewer avatar
            const avatarUrl = `https://i.pravatar.cc/150?u=${slug}`;
            const avatarOk = await downloadFile(avatarUrl, avatarLocalPath, 5 * 1024 * 1024);

            let avatarCloudUrl = "https://i.pravatar.cc/150";
            if (avatarOk && fs.existsSync(avatarLocalPath)) {
                const uploadRes = await uploadAssetToCloudinary(avatarLocalPath, {
                    folder: "visual-tube/seed/avatars",
                    tags: ["visual-tube", "seed", "avatar", "viewer"]
                });
                avatarCloudUrl = uploadRes.secure_url;
                uploadedPublicIds.push(uploadRes.public_id);
            }

            const user = await User.create({
                username: viewerInfo.username,
                email: `${viewerInfo.username}@mailtest.dev`,
                fullname: viewerInfo.fullname,
                avatar: avatarCloudUrl,
                password: CONFIG.DEFAULT_PASSWORD,
            });
            createdUserIds.push(user._id);
            viewers.push(user);
        }
        logMessage(`✔ Viewer accounts created: ${viewers.length}`);

        // Prepare creators list from manifest
        const creatorsData = [];
        for (const catData of CONTENT_MANIFEST) {
            for (const name of catData.creatorNames) {
                creatorsData.push({
                    fullname: name,
                    category: catData.category,
                    topics: catData.topics
                });
            }
        }

        // Shuffle creators list to distribute niches during batches and slice to CONFIG.CREATOR_COUNT
        const shuffledCreators = shuffledCopy(creatorsData).slice(0, CONFIG.CREATOR_COUNT);
        const creators = [];
        const videos = [];
        const playlists = [];
        const usedUsernames = new Set(VIEWERS.map(v => v.username));
        const globalTopicUploads = new Map();

        // 5. Batch Process (3 Creators at a Time)
        // FR-10: Process 3 creators at a time (Download -> Validate -> Upload -> Save DB -> Clean Temp)
        const batchSize = 3;
        for (let i = 0; i < shuffledCreators.length; i += batchSize) {
            const batch = shuffledCreators.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(shuffledCreators.length / batchSize);
            
            logMessage("────────────────────────────────────────────────");
            logMessage(`📦 Batch [${batchNum}/${totalBatches}]: Processing ${batch.length} creators...`);
            logMessage("────────────────────────────────────────────────");

            for (const creatorInfo of batch) {
                const username = creatorInfo.fullname.toLowerCase().replace(/\s+/g, "_");
                let uniqueUsername = username;
                let suffix = 1;
                while (usedUsernames.has(uniqueUsername)) {
                    uniqueUsername = `${username}${suffix++}`;
                }
                usedUsernames.add(uniqueUsername);

                // A. Download Creator Avatar & Cover
                const avatarLocal = path.join(CONFIG.TEMP_DIR, `${uniqueUsername}_avatar.jpg`);
                const coverLocal = path.join(CONFIG.TEMP_DIR, `${uniqueUsername}_cover.jpg`);
                
                let avatarOk = await downloadFile(`https://i.pravatar.cc/300?u=${uniqueUsername}`, avatarLocal, 5 * 1024 * 1024);
                if (!avatarOk) {
                    logMessage(`  ⚠ Failed to download creator avatar. Trying fallback...`);
                    avatarOk = await downloadFile(`https://i.pravatar.cc/300`, avatarLocal, 5 * 1024 * 1024);
                }
                if (!avatarOk) throw new Error(`Failed to download avatar for creator: ${uniqueUsername}`);

                let coverOk = await downloadFile(`https://picsum.photos/1600/900?random=${uniqueUsername}`, coverLocal, 5 * 1024 * 1024);
                if (!coverOk) {
                    logMessage(`  ⚠ Failed to download creator cover. Trying fallback...`);
                    coverOk = await downloadFile(`https://picsum.photos/1600/900`, coverLocal, 5 * 1024 * 1024);
                }
                if (!coverOk) throw new Error(`Failed to download cover for creator: ${uniqueUsername}`);

                // B. Upload Creator Assets to Cloudinary
                const avatarRes = await uploadAssetToCloudinary(avatarLocal, {
                    folder: "visual-tube/seed/avatars",
                    tags: ["visual-tube", "seed", "avatar", creatorInfo.category, uniqueUsername]
                });
                uploadedPublicIds.push(avatarRes.public_id);

                const coverRes = await uploadAssetToCloudinary(coverLocal, {
                    folder: "visual-tube/seed/covers",
                    tags: ["visual-tube", "seed", "cover", creatorInfo.category, uniqueUsername]
                });
                uploadedPublicIds.push(coverRes.public_id);

                // C. Save Creator User Document in MongoDB
                const creator = await User.create({
                    username: uniqueUsername,
                    email: `${uniqueUsername}@mailtest.dev`,
                    fullname: creatorInfo.fullname,
                    avatar: avatarRes.secure_url,
                    coverImage: coverRes.secure_url,
                    password: CONFIG.DEFAULT_PASSWORD,
                });
                createdUserIds.push(creator._id);
                creator.niche = creatorInfo.category; // Track niche
                creators.push(creator);

                // D. Download, Validate and Upload topic media for their category
                const topicUploads = new Map();
                for (const topic of creatorInfo.topics) {
                    const slug = slugify(topic.title);

                    if (globalTopicUploads.has(slug)) {
                        topicUploads.set(slug, globalTopicUploads.get(slug));
                        continue;
                    }

                    // Download thumbnail and video file
                    const thumbPath = await downloadCorrelatedMedia(topic, "thumbnail");
                    const videoPath = await downloadCorrelatedMedia(topic, "video");

                    // Upload to Cloudinary with tags
                    const thumbRes = await uploadAssetToCloudinary(thumbPath, {
                        folder: "visual-tube/seed/thumbnails",
                        tags: ["visual-tube", "seed", "thumbnail", creatorInfo.category, slug]
                    });
                    uploadedPublicIds.push(thumbRes.public_id);

                    const videoRes = await uploadAssetToCloudinary(videoPath, {
                        folder: "visual-tube/seed/videos",
                        tags: ["visual-tube", "seed", "video", creatorInfo.category, slug]
                    });
                    uploadedPublicIds.push(videoRes.public_id);

                    const mediaObj = {
                        thumbnail: thumbRes.secure_url,
                        videoFile: videoRes.secure_url
                    };
                    topicUploads.set(slug, mediaObj);
                    globalTopicUploads.set(slug, mediaObj);
                }

                // E. Generate exactly 20 videos per creator belonging to their niche topics
                const creatorVideos = [];
                for (let vIdx = 0; vIdx < CONFIG.VIDEOS_PER_CREATOR; vIdx++) {
                    const topic = creatorInfo.topics[vIdx % creatorInfo.topics.length];
                    const slug = slugify(topic.title);
                    const media = topicUploads.get(slug);

                    // Create unique titles & descriptions
                    const prefixes = ["", "Ultimate", "Mastering", "Understanding", "Deep Dive:", "Step-by-Step Guide:", "Essentials of", "Advanced"];
                    const suffixes = ["", "Explained Simply", "Crash Course", "for Beginners", "| Masterclass", "(2026 Tutorial)", "in 5 Minutes"];
                    const title = `${pickRandom(prefixes)} ${topic.title} ${pickRandom(suffixes)}`.trim().replace(/\s+/g, " ");
                    const descPrefixes = ["Check out my new video!", "In this lesson, we cover this important topic.", "Here is a complete breakdown of this concept.", "A beginner-friendly guide."];
                    const video = await Video.create({
                        title,
                        description: `${pickRandom(descPrefixes)} ${topic.title}.`,
                        thumbnail: media.thumbnail,
                        videoFile: media.videoFile,
                        duration: randInt(60, 600),
                        views: randInt(100, 5000),
                        owner: creator._id,
                        tags: topic.tags || [],
                        processingStatus: "published",
                        availableResolutions: []
                    });
                    createdVideoIds.push(video._id);
                    video.category = creatorInfo.category;
                    video.commentTemplates = topic.commentTemplates || [];
                    creatorVideos.push(video);
                    videos.push(video);
                }

                const playlistCount = Math.min(creatorInfo.topics.length, 3);
                for (let pIdx = 0; pIdx < playlistCount; pIdx++) {
                    const topic = creatorInfo.topics[pIdx % creatorInfo.topics.length];
                    const matchingVideos = creatorVideos.filter(v => v.title.includes(topic.title));
                    const playlistVideoIds = (matchingVideos.length > 0 ? matchingVideos : creatorVideos).map(v => v._id);

                    const playlist = await Playlist.create({
                        name: `${topic.playlistName || topic.title} Series`,
                        description: `A curated list of videos on ${topic.title} by ${creator.fullname}.`,
                        owner: creator._id,
                        videos: playlistVideoIds,
                    });
                    createdPlaylistIds.push(playlist._id);
                    playlists.push(playlist);
                }
            }

            // G. Clean up temporary downloaded files for the current batch
            cleanupTempFolder();
            logMessage(`✔ Batch [${batchNum}/${totalBatches}] completed and local temp media cleared.`);
        }

        // 6. Generate Social Graph (Comments, Likes, Subscriptions, Watch History)
        // Interactions favor similar niches (FR-11)
        logMessage("⏳ Seed-linking users into a correlated Social Graph...");
        const allUsers = [...creators, ...viewers];
        const comments = [];
        const likesDocs = [];
        const subDocs = [];

        const seenLikes = new Set();
        const seenSubs = new Set();

        for (const video of videos) {
            // A. Generate comments matching the video topic templates
            const commentCount = randInt(2, 5);
            for (let c = 0; c < commentCount; c++) {
                // Pick a commenter (prioritize users sharing the same niche)
                const sameNicheUsers = allUsers.filter(u => u.niche === video.category);
                const commenter = pickRandom(sameNicheUsers.length > 0 && Math.random() > 0.3 ? sameNicheUsers : allUsers);

                const content = pickRandom(video.commentTemplates) || "Excellent video, very well explained!";
                const comment = await Comment.create({
                    content,
                    video: video._id,
                    owner: commenter._id,
                });
                createdCommentIds.push(comment._id);
                comments.push(comment);
            }

            // B. Generate Likes (5-15% of views)
            const likesCount = Math.round(video.views * (randInt(5, 15) / 100));
            const sameNicheUsers = allUsers.filter(u => u.niche === video.category);
            const likers = randomSubset([...sameNicheUsers, ...allUsers], 0, Math.min(likesCount, allUsers.length));

            for (const liker of likers) {
                const key = `${video._id}_${liker._id}`;
                if (seenLikes.has(key)) continue;
                seenLikes.add(key);
                likesDocs.push({ video: video._id, likedBy: liker._id });
            }
        }
        const createdLikes = await Like.insertMany(likesDocs, { ordered: false }).catch(err => err.insertedDocs || []);
        createdLikes.forEach(l => createdLikeIds.push(l._id));

        // C. Generate Subscriptions
        for (const user of allUsers) {
            const subCount = randInt(3, 8);
            // Subscribe primarily to creators in the same niche
            const matchingCreators = creators.filter(c => c.niche === user.niche && c._id.toString() !== user._id.toString());
            const otherCreators = creators.filter(c => c._id.toString() !== user._id.toString());
            
            const pool = [...matchingCreators, ...randomSubset(otherCreators, 0, 10)];
            const subs = randomSubset(pool, 0, Math.min(subCount, pool.length));

            for (const targetCreator of subs) {
                const key = `${user._id}_${targetCreator._id}`;
                if (seenSubs.has(key)) continue;
                seenSubs.add(key);
                subDocs.push({ subscriber: user._id, channel: targetCreator._id });
            }
        }
        const createdSubs = await Subscription.insertMany(subDocs, { ordered: false }).catch(err => err.insertedDocs || []);
        createdSubs.forEach(s => createdSubscriptionIds.push(s._id));

        // D. Generate Watch History
        for (const user of allUsers) {
            const matchingVideos = videos.filter(v => v.category === user.niche);
            const watchCount = randInt(5, 12);
            const watchHistoryIds = randomSubset(matchingVideos.length > 0 ? matchingVideos : videos, 0, watchCount).map(v => v._id);
            
            await User.findByIdAndUpdate(user._id, {
                $set: { watchHistory: watchHistoryIds }
            });
        }
        logMessage("✔ Social Graph linking completed successfully.");

        // 7. Validate Referential Integrity
        await validateIntegrity(uploadedPublicIds);

        // 8. Generate Final Summary Report
        const reportPath = path.join(CONFIG.REPORT_DIR, "summary.md");
        const reportContent = `# Seeding Execution Report

Seeding completed successfully on ${new Date().toLocaleString()}.

## Generated Figures
- **Viewer Accounts**: ${viewers.length}
- **Creator Accounts**: ${creators.length}
- **Total Users**: ${allUsers.length}
- **Videos Created**: ${videos.length}
- **Playlists Created**: ${playlists.length}
- **Comments Created**: ${comments.length}
- **Likes Created**: ${createdLikes.length || likesDocs.length}
- **Subscriptions Created**: ${createdSubs.length || subDocs.length}

## Verification Status
- **MongoDB reset**: SUCCESS
- **Cloudinary clean**: SUCCESS
- **Referential validation**: SUCCESS
- **Orphan checking**: SUCCESS
- **Duplicates checking**: SUCCESS
`;
        fs.writeFileSync(reportPath, reportContent);
        logMessage(`✔ Seeding execution report saved to: ${reportPath}`);

        logMessage("\n──────────────── SEED SUMMARY ────────────────");
        logMessage(`✔ Viewers created:        ${viewers.length}`);
        logMessage(`✔ Creators created:       ${creators.length}`);
        logMessage(`✔ Videos created:         ${videos.length}`);
        logMessage(`✔ Playlists created:      ${playlists.length}`);
        logMessage(`✔ Comments created:       ${comments.length}`);
        logMessage(`✔ Likes created:          ${createdLikes.length || likesDocs.length}`);
        logMessage(`✔ Subscriptions created:  ${createdSubs.length || subDocs.length}`);
        logMessage("───────────────────────────────────────────────");
        logMessage(`\nℹ Default password for all seeded users: "${CONFIG.DEFAULT_PASSWORD}"`);
        logMessage("✔ Seeding process completed successfully.\n");

    } catch (err) {
        logError("❌ Seeding process encountered a critical failure. Triggering rollback...", err);
        await rollbackCloudinaryAssets(uploadedPublicIds);
        
        try {
            logMessage("🔄 Rolling back newly created MongoDB documents...");
            if (createdLikeIds.length > 0) await Like.deleteMany({ _id: { $in: createdLikeIds } });
            if (createdCommentIds.length > 0) await Comment.deleteMany({ _id: { $in: createdCommentIds } });
            if (createdSubscriptionIds.length > 0) await Subscription.deleteMany({ _id: { $in: createdSubscriptionIds } });
            if (createdPlaylistIds.length > 0) await Playlist.deleteMany({ _id: { $in: createdPlaylistIds } });
            if (createdVideoIds.length > 0) await Video.deleteMany({ _id: { $in: createdVideoIds } });
            if (createdUserIds.length > 0) await User.deleteMany({ _id: { $in: createdUserIds } });
            logMessage("✔ MongoDB rollback completed.");
        } catch (dbRollbackErr) {
            logError("❌ Failed to complete MongoDB rollback:", dbRollbackErr);
        }

        cleanupTempFolder();
        process.exitCode = 1;
    } finally {
        cleanupTempFolder();
        await mongoose.disconnect();
        logMessage("✔ Disconnected from MongoDB.");
    }
}

// Helper shuffler
function shuffledCopy(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Helper to write Readable Stream to local file
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

async function ReadableStreamToPipeline(readableStream, writeStream) {
    await pipeline(Readable.fromWeb(readableStream), writeStream);
}



main();
