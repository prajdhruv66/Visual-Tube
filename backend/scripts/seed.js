/**
 * scripts/seed.js
 *
 * Fully self-contained seed script for the Visual-Tube backend.
 *
 * On every run it will:
 *   1. Connect to MongoDB
 *   2. Ensure seed-assets/{avatars,covers,thumbnails,videos} exist
 *   3. Auto-download royalty-free media into any folder that doesn't already
 *      have enough files (acts as a permanent local cache - nothing is
 *      re-downloaded on subsequent runs)
 *   4. Upload media to Cloudinary (via your existing uploadOnCloudinary util)
 *   5. Create users -> videos -> playlists -> comments -> likes -> subscriptions
 *   6. Print a summary and disconnect
 *
 * Usage:
 *   node -r dotenv/config scripts/seed.js
 *   node -r dotenv/config scripts/seed.js --clear     (wipes DB collections first)
 *
 * Optional .env variables (all optional - the script falls back to
 * no-key public sources when they're absent):
 *
 *   PEXELS_API_KEY=      # https://www.pexels.com/api/  (preferred source, photos + videos)
 *   PIXABAY_API_KEY=     # https://pixabay.com/api/docs/ (secondary source, photos + videos)
 *
 * If neither key is set, the script still works end-to-end using:
 *   - https://i.pravatar.cc            (avatar / face photos, no key required)
 *   - https://picsum.photos            (generic landscape photos, no key required)
 *   - a small curated list of public sample MP4 clips (videos)
 *
 * Media counts and download concurrency are tunable in CONFIG below.
 */

import "dotenv/config";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import connect_mongodb from "../src/db/index.js";
import { User } from "../src/models/user.model.js";
import { Video } from "../src/models/video.model.js";
import { Comment } from "../src/models/comment.model.js";
import { Like } from "../src/models/likes.model.js";
import { Playlist } from "../src/models/playlist.model.js";
import { Subscription } from "../src/models/subscription.model.js";
import { uploadOnCloudinary } from "../src/utils/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ASSETS_ROOT = path.join(PROJECT_ROOT, "seed-assets");
const SCRATCH_DIR = path.join(os.tmpdir(), "visual-tube-seed-scratch");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || "";

// ---------------------------------------------------------------------------
// CONFIG (overridable via env vars)
// ---------------------------------------------------------------------------
const CONFIG = {
    CLEAR: process.argv.includes("--clear") || process.env.SEED_CLEAR === "true",
    USER_COUNT: randInt(
        process.env.USER_MIN ? Number(process.env.USER_MIN) : 10,
        process.env.USER_MAX ? Number(process.env.USER_MAX) : 15
    ),
    VIDEOS_PER_USER_MIN: 1,
    VIDEOS_PER_USER_MAX: 5,
    PLAYLISTS_PER_USER_MIN: 1,
    PLAYLISTS_PER_USER_MAX: 3,
    PLAYLIST_VIDEOS_MIN: 2,
    PLAYLIST_VIDEOS_MAX: 8,
    COMMENT_COUNT_MIN: 100,
    COMMENT_COUNT_MAX: 200,
    VIDEO_LIKE_RATIO_MIN: 0.1,
    VIDEO_LIKE_RATIO_MAX: 0.6,
    COMMENT_LIKE_RATIO_MIN: 0.0,
    COMMENT_LIKE_RATIO_MAX: 0.5,
    SUBSCRIPTIONS_PER_USER_MIN: 2,
    SUBSCRIPTIONS_PER_USER_MAX: 5,
    DEFAULT_PASSWORD: "Password@123",

    // Media bootstrap targets
    AVATAR_TARGET_COUNT: Number(process.env.AVATAR_TARGET_COUNT || 15),
    COVER_TARGET_COUNT: Number(process.env.COVER_TARGET_COUNT || 10),
    THUMBNAIL_TARGET_COUNT: Number(process.env.THUMBNAIL_TARGET_COUNT || 30),
    VIDEO_TARGET_COUNT: Number(process.env.VIDEO_TARGET_COUNT || 28),
    DOWNLOAD_CONCURRENCY: Number(process.env.DOWNLOAD_CONCURRENCY || 5),
    DOWNLOAD_ATTEMPTS_PER_CANDIDATE: 3,
};

// ---------------------------------------------------------------------------
// GENERIC HELPERS
// ---------------------------------------------------------------------------
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function random(min, max) {
    return randInt(min, max);
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function pickRandom(array) {
    if (!array || array.length === 0) return undefined;
    return array[randInt(0, array.length - 1)];
}

function randomSubset(array, min, max) {
    if (!array || array.length === 0) return [];
    const count = Math.min(array.length, randInt(min, max));
    return shuffle(array).slice(0, count);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// DATA GENERATORS (no external faker dependency, self-contained)
// ---------------------------------------------------------------------------
const FIRST_NAMES = [
    "Rahul", "Priya", "Aarav", "Neha", "Rohan", "Ananya", "Karan", "Isha",
    "Vivaan", "Diya", "Aditya", "Kavya", "Arjun", "Sneha", "Vikram", "Pooja",
    "Siddharth", "Meera", "Nikhil", "Riya",
];

const LAST_NAMES = [
    "Sharma", "Patel", "Mehta", "Shah", "Joshi", "Desai", "Trivedi", "Gupta",
    "Verma", "Iyer", "Nair", "Reddy", "Chopra", "Malhotra", "Kapoor", "Bhatt",
    "Rao", "Pillai", "Agarwal", "Bose",
];

const VIDEO_TOPICS = [
    "Node.js Authentication",
    "Understanding MongoDB Aggregation",
    "JWT Explained",
    "Building a YouTube Backend",
    "Express Error Handling",
    "Mastering Mongoose Middleware",
    "REST API Design Best Practices",
    "React State Management",
    "Docker for Beginners",
    "CI/CD with GitHub Actions",
    "System Design Basics",
    "Redis Caching Strategies",
    "GraphQL vs REST",
    "Building a Chat App with Socket.io",
    "Deploying Node Apps to AWS",
    "Introduction to TypeScript",
    "Debugging Node.js Applications",
    "Building Scalable Microservices",
    "Database Indexing Explained",
    "Rate Limiting APIs",
];

const VIDEO_DESC_TEMPLATES = [
    "In this video, we dive deep into {topic} and cover everything you need to know to get started.",
    "A complete, beginner-friendly walkthrough of {topic} with practical, real-world examples.",
    "Learn {topic} step by step in this hands-on tutorial built for backend developers.",
    "This tutorial breaks down {topic} into simple concepts anyone can follow along with.",
    "Everything about {topic} explained clearly, with code samples and common pitfalls to avoid.",
];

const COMMENT_TEMPLATES = [
    "Great explanation!",
    "Loved this video.",
    "Very useful, thanks a lot!",
    "Thanks!",
    "Can you make another part?",
    "This helped me understand the concept finally.",
    "Best tutorial on this topic so far.",
    "Please make a video on the next steps too.",
    "Subscribed! Looking forward to more content.",
    "Clear and to the point, appreciate it.",
    "I was stuck on this for days, thank you!",
    "Could you share the source code?",
    "Amazing content as always.",
    "Underrated channel, deserves more views.",
    "Nice pace, easy to follow along.",
];

const PLAYLIST_NAME_POOL = [
    "Backend Tutorials",
    "MongoDB",
    "Watch Later",
    "Learning Express",
    "Node.js",
    "Favorites",
    "System Design",
    "Weekend Watch",
    "Deep Dives",
    "Quick Tips",
];

const TAG_POOL = [
    "nodejs", "mongodb", "javascript", "backend", "express",
    "jwt", "authentication", "api", "tutorial", "webdev",
    "database", "docker", "typescript", "react", "microservices",
];

function generateIndianName() {
    const first = pickRandom(FIRST_NAMES);
    const last = pickRandom(LAST_NAMES);
    return { first, last, full: `${first} ${last}` };
}

function generateUsername(fullname, usedUsernames) {
    const base = fullname.toLowerCase().replace(/\s+/g, "_");
    let candidate = base;
    let attempt = 0;
    while (usedUsernames.has(candidate)) {
        attempt += 1;
        candidate = `${base}${randInt(1, 999)}`;
        if (attempt > 20) {
            candidate = `${base}${Date.now()}`;
            break;
        }
    }
    usedUsernames.add(candidate);
    return candidate;
}

function generateEmail(username) {
    const domains = ["example.com", "mailtest.dev", "demo-mail.com"];
    return `${username}@${pickRandom(domains)}`;
}

function generateVideoTitle() {
    const topic = pickRandom(VIDEO_TOPICS);
    const suffix = pickRandom(["", " - Part 1", " (2026 Update)", " | Full Guide", " Explained Simply", ""]);
    return `${topic}${suffix}`.trim();
}

function generateVideoDescription(title) {
    const template = pickRandom(VIDEO_DESC_TEMPLATES);
    return template.replace("{topic}", title);
}

function generateComment() {
    return pickRandom(COMMENT_TEMPLATES);
}

function generatePlaylistName(usedNames) {
    let candidate = pickRandom(PLAYLIST_NAME_POOL);
    let attempt = 0;
    while (usedNames.has(candidate) && attempt < 10) {
        candidate = `${pickRandom(PLAYLIST_NAME_POOL)} ${randInt(2, 99)}`;
        attempt += 1;
    }
    usedNames.add(candidate);
    return candidate;
}

function generateTags() {
    return randomSubset(TAG_POOL, 2, 5);
}

// ---------------------------------------------------------------------------
// LOW-LEVEL FILE / DOWNLOAD HELPERS
// ---------------------------------------------------------------------------
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".mkv", ".webm"]);
const VALID_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✔ Created folder: ${dirPath}`);
    }
}

function getFilesFromDir(dirPath) {
    if (!fs.existsSync(dirPath)) return [];
    return fs
        .readdirSync(dirPath)
        .filter((f) => VALID_EXTENSIONS.has(path.extname(f).toLowerCase()))
        .map((f) => path.join(dirPath, f));
}

/**
 * Downloads `url` into `destPath`, writing to a `.part` file first so that a
 * failed/interrupted download never leaves a partial file behind at the
 * final destination. Retries up to `maxAttempts` times.
 */
async function downloadWithRetries(url, destPath, maxAttempts = 3) {
    const partPath = `${destPath}.part`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const res = await fetch(url, { redirect: "follow" });
            if (!res.ok || !res.body) {
                throw new Error(`HTTP ${res.status}`);
            }

            const fileStream = fs.createWriteStream(partPath);
            await pipeline(Readable.fromWeb(res.body), fileStream);

            const stats = fs.statSync(partPath);
            if (stats.size === 0) {
                throw new Error("Downloaded file is empty");
            }

            fs.renameSync(partPath, destPath);
            return true;
        } catch (err) {
            if (fs.existsSync(partPath)) {
                try {
                    fs.unlinkSync(partPath);
                } catch (_) {
                    /* ignore cleanup errors */
                }
            }
            if (attempt === maxAttempts) {
                console.warn(`  ⚠ giving up on ${url} (${err.message})`);
                return false;
            }
            await sleep(300 * attempt);
        }
    }
    return false;
}

/**
 * Concurrency-limited runner that pulls candidates from an async generator
 * one at a time, downloads each into a uniquely-named file inside `dirPath`,
 * and stops as soon as `deficit` successful downloads have landed (or the
 * candidate generator is exhausted). Failed candidates are simply skipped
 * in favor of the next one - nothing partial is ever left on disk.
 */
async function downloadCandidatesUntilSatisfied({ label, dirPath, deficit, startIndex, candidateGenerator }) {
    let successCount = 0;
    let nextFileIndex = startIndex;
    let exhausted = false;
    const iterator = candidateGenerator();

    async function worker() {
        while (successCount < deficit && !exhausted) {
            let step;
            try {
                step = await iterator.next();
            } catch (err) {
                console.warn(`  ⚠ candidate source error for ${label}: ${err.message}`);
                exhausted = true;
                return;
            }
            if (step.done) {
                exhausted = true;
                return;
            }

            const candidate = step.value;
            const fileIndex = nextFileIndex++;
            const destFilename = `${label}_${fileIndex}${candidate.ext}`;
            const destPath = path.join(dirPath, destFilename);

            const ok = await downloadWithRetries(candidate.url, destPath, CONFIG.DOWNLOAD_ATTEMPTS_PER_CANDIDATE);
            if (ok) successCount++;
        }
    }

    const workerCount = Math.min(CONFIG.DOWNLOAD_CONCURRENCY, Math.max(deficit, 1));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return successCount;
}

// ---------------------------------------------------------------------------
// ROYALTY-FREE MEDIA SOURCES (Pexels -> Pixabay -> no-key public fallback)
// ---------------------------------------------------------------------------
async function pexelsSearchPhotos(query, perPage = 15) {
    const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
        { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) throw new Error(`Pexels photo search failed (${res.status})`);
    const data = await res.json();
    return (data.photos || []).map((p) => ({ url: p.src?.large || p.src?.original, ext: ".jpg" })).filter((c) => c.url);
}

async function pexelsSearchVideos(query, perPage = 15) {
    const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
        { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) throw new Error(`Pexels video search failed (${res.status})`);
    const data = await res.json();
    const videos = (data.videos || []).slice().sort((a, b) => (a.duration || 999) - (b.duration || 999));
    const results = [];
    for (const v of videos) {
        const files = (v.video_files || []).slice().sort((a, b) => (a.width || 0) - (b.width || 0));
        const preferred = files.find((f) => f.width && f.width >= 480 && f.width <= 1280) || files[0];
        if (preferred?.link) results.push({ url: preferred.link, ext: ".mp4" });
    }
    return results;
}

async function pixabaySearchPhotos(query, perPage = 15) {
    const res = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${perPage}`
    );
    if (!res.ok) throw new Error(`Pixabay photo search failed (${res.status})`);
    const data = await res.json();
    return (data.hits || []).map((h) => ({ url: h.largeImageURL || h.webformatURL, ext: ".jpg" })).filter((c) => c.url);
}

async function pixabaySearchVideos(query, perPage = 15) {
    const res = await fetch(
        `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=${perPage}`
    );
    if (!res.ok) throw new Error(`Pixabay video search failed (${res.status})`);
    const data = await res.json();
    return (data.hits || [])
        .map((h) => ({ url: h.videos?.medium?.url || h.videos?.small?.url || h.videos?.large?.url, ext: ".mp4" }))
        .filter((c) => c.url);
}

// No-key fallback sources -----------------------------------------------------
function* pravatarCandidates() {
    // i.pravatar.cc serves ~70 distinct real face photos, cycle through them.
    let i = 0;
    while (true) {
        const imgNumber = (i % 70) + 1;
        yield { url: `https://i.pravatar.cc/500?img=${imgNumber}`, ext: ".jpg" };
        i++;
    }
}

function* picsumCandidates(width, height, seedPrefix) {
    let i = 0;
    while (true) {
        yield { url: `https://picsum.photos/seed/${seedPrefix}${i}/${width}/${height}`, ext: ".jpg" };
        i++;
    }
}

// Small curated list of stable, publicly hosted, short royalty-free sample
// MP4 clips used only as a last-resort fallback when no video API key is
// configured. Cycled with unique destination filenames as needed.
const FALLBACK_VIDEO_URLS = [
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://www.w3schools.com/html/movie.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    "https://sample-videos.com/video321/mp4/480/big_buck_bunny_480p_1mb.mp4",
    "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
];

function* fallbackVideoCandidates() {
    let i = 0;
    while (true) {
        const url = FALLBACK_VIDEO_URLS[i % FALLBACK_VIDEO_URLS.length];
        yield { url, ext: ".mp4" };
        i++;
    }
}

/**
 * Builds a combined async candidate generator for a photo category:
 * Pexels (if key) -> Pixabay (if key) -> infinite no-key fallback generator.
 */
async function* photoCandidateGenerator(queries, fallbackGenFactory) {
    if (PEXELS_API_KEY) {
        for (const q of queries) {
            try {
                const results = await pexelsSearchPhotos(q, 15);
                for (const c of results) yield c;
            } catch (err) {
                console.warn(`  ⚠ Pexels photo search "${q}" failed: ${err.message}`);
            }
        }
    }
    if (PIXABAY_API_KEY) {
        for (const q of queries) {
            try {
                const results = await pixabaySearchPhotos(q, 15);
                for (const c of results) yield c;
            } catch (err) {
                console.warn(`  ⚠ Pixabay photo search "${q}" failed: ${err.message}`);
            }
        }
    }
    yield* fallbackGenFactory();
}

async function* videoCandidateGenerator(queries) {
    if (PEXELS_API_KEY) {
        for (const q of queries) {
            try {
                const results = await pexelsSearchVideos(q, 15);
                for (const c of results) yield c;
            } catch (err) {
                console.warn(`  ⚠ Pexels video search "${q}" failed: ${err.message}`);
            }
        }
    }
    if (PIXABAY_API_KEY) {
        for (const q of queries) {
            try {
                const results = await pixabaySearchVideos(q, 15);
                for (const c of results) yield c;
            } catch (err) {
                console.warn(`  ⚠ Pixabay video search "${q}" failed: ${err.message}`);
            }
        }
    }
    yield* fallbackVideoCandidates();
}

// ---------------------------------------------------------------------------
// MEDIA BOOTSTRAP (folder check -> download deficit -> permanent local cache)
// ---------------------------------------------------------------------------
async function bootstrapMediaCategory({ label, dirPath, targetCount, candidateGenerator }) {
    ensureDirSync(dirPath);
    const existingFiles = getFilesFromDir(dirPath);

    if (existingFiles.length >= targetCount) {
        console.log(`✔ ${label}: cache already has ${existingFiles.length}/${targetCount} files, skipping download`);
        return;
    }

    const deficit = targetCount - existingFiles.length;
    console.log(`⬇ ${label}: found ${existingFiles.length}/${targetCount}, downloading ${deficit} more...`);

    const successCount = await downloadCandidatesUntilSatisfied({
        label,
        dirPath,
        deficit,
        startIndex: existingFiles.length,
        candidateGenerator,
    });

    console.log(`✔ ${label}: downloaded ${successCount}/${deficit} new file(s) (total now ${existingFiles.length + successCount})`);

    if (existingFiles.length + successCount === 0) {
        throw new Error(
            `Could not obtain any media for "${label}". Check your internet connection or configure PEXELS_API_KEY / PIXABAY_API_KEY in .env.`
        );
    }
}

async function bootstrapAllMedia() {
    console.log("\n📦 Checking / bootstrapping media assets...");

    if (!PEXELS_API_KEY && !PIXABAY_API_KEY) {
        console.log(
            "ℹ No PEXELS_API_KEY / PIXABAY_API_KEY set - using no-key public fallback sources (pravatar.cc, picsum.photos, sample MP4 clips)."
        );
    }

    ensureDirSync(ASSETS_ROOT);

    await bootstrapMediaCategory({
        label: "avatars",
        dirPath: path.join(ASSETS_ROOT, "avatars"),
        targetCount: CONFIG.AVATAR_TARGET_COUNT,
        candidateGenerator: () =>
            photoCandidateGenerator(
                ["indian person portrait", "diverse people portrait", "professional headshot", "smiling face portrait"],
                pravatarCandidates
            ),
    });

    await bootstrapMediaCategory({
        label: "covers",
        dirPath: path.join(ASSETS_ROOT, "covers"),
        targetCount: CONFIG.COVER_TARGET_COUNT,
        candidateGenerator: () =>
            photoCandidateGenerator(
                ["nature landscape", "city skyline", "mountains", "abstract background"],
                () => picsumCandidates(1600, 900, "cover")
            ),
    });

    await bootstrapMediaCategory({
        label: "thumbnails",
        dirPath: path.join(ASSETS_ROOT, "thumbnails"),
        targetCount: CONFIG.THUMBNAIL_TARGET_COUNT,
        candidateGenerator: () =>
            photoCandidateGenerator(
                ["technology", "workspace desk", "coding programming", "nature", "city street", "lifestyle"],
                () => picsumCandidates(1280, 720, "thumb")
            ),
    });

    await bootstrapMediaCategory({
        label: "videos",
        dirPath: path.join(ASSETS_ROOT, "videos"),
        targetCount: CONFIG.VIDEO_TARGET_COUNT,
        candidateGenerator: () =>
            videoCandidateGenerator(["technology", "nature", "coding", "workspace", "city", "lifestyle"]),
    });

    console.log("✔ Media bootstrap complete - seed-assets/ now acts as a permanent local cache.\n");
}

// ---------------------------------------------------------------------------
// CLOUDINARY UPLOAD HELPERS
// ---------------------------------------------------------------------------
function ensureScratchDir() {
    if (!fs.existsSync(SCRATCH_DIR)) {
        fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    }
}

function cleanupScratchDir() {
    if (fs.existsSync(SCRATCH_DIR)) {
        fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
    }
}

// Cache: originalFilePath -> uploaded secure_url (avoids re-uploading the
// same local asset to Cloudinary multiple times within a single run).
const uploadCache = new Map();

/**
 * Uploads a random file from `pool` via the project's uploadOnCloudinary
 * utility. Because that utility deletes the local file it's given (it's
 * designed for one-shot multer temp files), we copy the chosen asset into a
 * scratch tmp file first - the ORIGINAL in seed-assets/ is never touched and
 * can be reused indefinitely across runs.
 */
async function uploadRandomAsset(pool, label) {
    const original = pickRandom(pool);
    if (!original) {
        throw new Error(`No usable files found for "${label}" even after media bootstrap.`);
    }

    if (uploadCache.has(original)) {
        return uploadCache.get(original);
    }

    ensureScratchDir();
    const scratchPath = path.join(
        SCRATCH_DIR,
        `${label}_${Date.now()}_${randInt(1000, 9999)}${path.extname(original)}`
    );
    fs.copyFileSync(original, scratchPath);

    const result = await uploadOnCloudinary(scratchPath);
    if (!result || !result.url) {
        throw new Error(`Cloudinary upload failed for asset: ${original}`);
    }

    uploadCache.set(original, result.url);
    return result.url;
}

// ---------------------------------------------------------------------------
// SEED STEPS
// ---------------------------------------------------------------------------
async function clearCollections() {
    console.log("🧹 Clearing existing collections...");
    await Promise.all([
        User.deleteMany({}),
        Video.deleteMany({}),
        Comment.deleteMany({}),
        Like.deleteMany({}),
        Playlist.deleteMany({}),
        Subscription.deleteMany({}),
    ]);
    console.log("✔ Collections cleared");
}

async function createUsers(mediaPools) {
    const usedUsernames = new Set();
    const users = [];

    for (let i = 0; i < CONFIG.USER_COUNT; i++) {
        const { full } = generateIndianName();
        const username = generateUsername(full, usedUsernames);
        const email = generateEmail(username);

        const [avatarUrl, coverUrl] = await Promise.all([
            uploadRandomAsset(mediaPools.avatars, "avatars"),
            mediaPools.covers.length > 0 ? uploadRandomAsset(mediaPools.covers, "covers") : Promise.resolve(undefined),
        ]);

        const user = await User.create({
            username,
            email,
            fullname: full,
            avatar: avatarUrl,
            coverImage: coverUrl,
            password: CONFIG.DEFAULT_PASSWORD, // hashed automatically by the pre-save hook
        });

        users.push(user);
    }

    console.log(`✔ Users created: ${users.length}`);
    return users;
}

async function createVideos(users, mediaPools) {
    const videos = [];

    for (const user of users) {
        const videoCount = randInt(CONFIG.VIDEOS_PER_USER_MIN, CONFIG.VIDEOS_PER_USER_MAX);

        for (let i = 0; i < videoCount; i++) {
            const title = generateVideoTitle();
            const [thumbnailUrl, videoFileUrl] = await Promise.all([
                uploadRandomAsset(mediaPools.thumbnails, "thumbnails"),
                uploadRandomAsset(mediaPools.videos, "videos"),
            ]);

            const video = await Video.create({
                videoFile: videoFileUrl,
                thumbnail: thumbnailUrl,
                title,
                description: generateVideoDescription(title),
                duration: randInt(60, 1800),
                views: randInt(0, 50000),
                isPublished: true,
                owner: user._id,
                tags: generateTags(),
            });

            videos.push(video);
        }
    }

    console.log(`✔ Videos uploaded/created: ${videos.length}`);
    return videos;
}

async function createPlaylists(users, videos) {
    const playlists = [];

    for (const user of users) {
        const playlistCount = randInt(CONFIG.PLAYLISTS_PER_USER_MIN, CONFIG.PLAYLISTS_PER_USER_MAX);
        const usedNames = new Set();

        for (let i = 0; i < playlistCount; i++) {
            const name = generatePlaylistName(usedNames);
            const chosenVideos = randomSubset(videos, CONFIG.PLAYLIST_VIDEOS_MIN, CONFIG.PLAYLIST_VIDEOS_MAX);

            const seen = new Set();
            const orderedUniqueVideoIds = [];
            for (const v of chosenVideos) {
                const id = v._id.toString();
                if (!seen.has(id)) {
                    seen.add(id);
                    orderedUniqueVideoIds.push(v._id);
                }
            }

            const playlist = await Playlist.create({
                name,
                description: `${name} - curated playlist by ${user.username}`,
                owner: user._id,
                videos: orderedUniqueVideoIds,
            });

            playlists.push(playlist);
        }
    }

    console.log(`✔ Playlists created: ${playlists.length}`);
    return playlists;
}

async function createComments(users, videos) {
    const commentCount = randInt(CONFIG.COMMENT_COUNT_MIN, CONFIG.COMMENT_COUNT_MAX);
    const docs = [];

    for (let i = 0; i < commentCount; i++) {
        const video = pickRandom(videos);
        const user = pickRandom(users);
        docs.push({
            content: generateComment(),
            video: video._id,
            owner: user._id,
        });
    }

    const created = await Comment.insertMany(docs);
    console.log(`✔ Comments created: ${created.length}`);
    return created;
}

async function createVideoLikes(users, videos) {
    const seenPairs = new Set();
    const docs = [];

    for (const video of videos) {
        const ratio = CONFIG.VIDEO_LIKE_RATIO_MIN + Math.random() * (CONFIG.VIDEO_LIKE_RATIO_MAX - CONFIG.VIDEO_LIKE_RATIO_MIN);
        const likerCount = Math.round(users.length * ratio);
        const likers = randomSubset(users, 0, likerCount);

        for (const liker of likers) {
            const key = `${video._id}_${liker._id}`;
            if (seenPairs.has(key)) continue;
            seenPairs.add(key);
            docs.push({ video: video._id, likedBy: liker._id });
        }
    }

    let created = [];
    if (docs.length > 0) {
        created = await Like.insertMany(docs, { ordered: false }).catch((err) => {
            if (err.writeErrors) return err.insertedDocs || [];
            throw err;
        });
    }

    console.log(`✔ Video likes created: ${Array.isArray(created) ? created.length : docs.length}`);
    return created;
}

async function createCommentLikes(users, comments) {
    const seenPairs = new Set();
    const docs = [];

    for (const comment of comments) {
        const ratio = CONFIG.COMMENT_LIKE_RATIO_MIN + Math.random() * (CONFIG.COMMENT_LIKE_RATIO_MAX - CONFIG.COMMENT_LIKE_RATIO_MIN);
        const likerCount = Math.round(users.length * ratio);
        if (likerCount <= 0) continue;
        const likers = randomSubset(users, 0, likerCount);

        for (const liker of likers) {
            const key = `${comment._id}_${liker._id}`;
            if (seenPairs.has(key)) continue;
            seenPairs.add(key);
            docs.push({ comment: comment._id, likedBy: liker._id });
        }
    }

    let created = [];
    if (docs.length > 0) {
        created = await Like.insertMany(docs, { ordered: false }).catch((err) => {
            if (err.writeErrors) return err.insertedDocs || [];
            throw err;
        });
    }

    console.log(`✔ Comment likes created: ${Array.isArray(created) ? created.length : docs.length}`);
    return created;
}

async function createSubscriptions(users) {
    const seenPairs = new Set();
    const docs = [];

    for (const user of users) {
        const subCount = randInt(CONFIG.SUBSCRIPTIONS_PER_USER_MIN, CONFIG.SUBSCRIPTIONS_PER_USER_MAX);
        const possibleChannels = users.filter((u) => u._id.toString() !== user._id.toString());
        const channels = randomSubset(possibleChannels, 0, subCount);

        for (const channel of channels) {
            const key = `${user._id}_${channel._id}`;
            if (seenPairs.has(key)) continue;
            seenPairs.add(key);
            docs.push({ subscriber: user._id, channel: channel._id });
        }
    }

    let created = [];
    if (docs.length > 0) {
        created = await Subscription.insertMany(docs, { ordered: false }).catch((err) => {
            if (err.writeErrors) return err.insertedDocs || [];
            throw err;
        });
    }

    console.log(`✔ Subscriptions created: ${Array.isArray(created) ? created.length : docs.length}`);
    return created;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
    console.log("🚀 Starting Visual-Tube database seed...\n");

    await connect_mongodb();
    console.log("✔ Connected to MongoDB");

    if (CONFIG.CLEAR) {
        await clearCollections();
    }

    try {
        await bootstrapAllMedia();

        const mediaPools = {
            avatars: getFilesFromDir(path.join(ASSETS_ROOT, "avatars")),
            covers: getFilesFromDir(path.join(ASSETS_ROOT, "covers")),
            thumbnails: getFilesFromDir(path.join(ASSETS_ROOT, "thumbnails")),
            videos: getFilesFromDir(path.join(ASSETS_ROOT, "videos")),
        };

        if (mediaPools.avatars.length === 0) {
            throw new Error("No avatar files available even after bootstrap - avatar is a required schema field.");
        }
        if (mediaPools.thumbnails.length === 0 || mediaPools.videos.length === 0) {
            throw new Error("No thumbnail or video files available even after bootstrap.");
        }

        const users = await createUsers(mediaPools);
        const videos = await createVideos(users, mediaPools);
        const playlists = await createPlaylists(users, videos);
        const comments = await createComments(users, videos);
        const videoLikes = await createVideoLikes(users, videos);
        const commentLikes = await createCommentLikes(users, comments);
        const subscriptions = await createSubscriptions(users);

        console.log("\n──────────────── SEED SUMMARY ────────────────");
        console.log(`✔ Users created:          ${users.length}`);
        console.log(`✔ Videos created:         ${videos.length}`);
        console.log(`✔ Playlists created:      ${playlists.length}`);
        console.log(`✔ Comments created:       ${comments.length}`);
        console.log(`✔ Video likes created:    ${videoLikes.length}`);
        console.log(`✔ Comment likes created:  ${commentLikes.length}`);
        console.log(`✔ Subscriptions created:  ${subscriptions.length}`);
        console.log("───────────────────────────────────────────────");
        console.log(`\nℹ Default password for all seeded users: "${CONFIG.DEFAULT_PASSWORD}"`);
        console.log("✔ Finished\n");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exitCode = 1;
    } finally {
        cleanupScratchDir();
        await mongoose.disconnect();
        console.log("✔ Disconnected from MongoDB");
    }
}

main();
