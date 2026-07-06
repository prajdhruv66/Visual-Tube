import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { CONFIG } from "../config/index.js";
import { logMessage, sleep, pickRandom } from "../utils/index.js";

// Curated list of high-quality, stable public domain / CC0 media links as fallback to guarantee 100% availability
const STABLE_VIDEO_POOL = [
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://www.w3schools.com/html/movie.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
];

const STABLE_IMAGE_POOL = [
    "https://picsum.photos/1280/720",
    "https://picsum.photos/1280/720?grayscale",
    "https://picsum.photos/1280/720?blur"
];

// ---------------------------------------------------------------------------
// LOW LEVEL DOWNLOAD PIPELINE
// ---------------------------------------------------------------------------
export async function downloadFile(url, destPath, maxSize = 15 * 1024 * 1024) {
    const partPath = `${destPath}.part`;
    const MAX_SIZE = maxSize;
    
    for (let attempt = 1; attempt <= CONFIG.DOWNLOAD_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        try {
            const res = await fetch(url, { 
                redirect: "follow",
                signal: controller.signal,
                headers: {
                    "User-Agent": "VisualTubeSeeder/1.0 (contact@example.com)"
                }
            });
            clearTimeout(timeoutId);

            if (!res.ok || !res.body) {
                throw new Error(`HTTP Status ${res.status}`);
            }

            const len = res.headers.get("content-length");
            if (len && parseInt(len, 10) > MAX_SIZE) {
                throw new Error(`File is too large: ${Math.round(parseInt(len, 10) / 1024 / 1024)}MB (max 15MB)`);
            }

            const writer = fs.createWriteStream(partPath);
            await pipeline(Readable.fromWeb(res.body), writer);

            const stats = fs.statSync(partPath);
            if (stats.size === 0) {
                throw new Error("Downloaded empty file.");
            }
            if (stats.size > MAX_SIZE) {
                throw new Error(`Downloaded file exceeded maximum allowed size: ${stats.size} bytes`);
            }

            fs.renameSync(partPath, destPath);
            return true;
        } catch (err) {
            clearTimeout(timeoutId);
            if (fs.existsSync(partPath)) {
                try { fs.unlinkSync(partPath); } catch (_) {}
            }
            logMessage(`  ⚠ Download attempt ${attempt} failed: ${url} (${err.name === "AbortError" ? "Timeout" : err.message})`);
            
            const isTransient = err.message.includes("fetch failed") || 
                                err.name === "AbortError" || 
                                err.message.includes("Timeout") || 
                                err.message.includes("HTTP Status 503") || 
                                err.message.includes("HTTP Status 429");
                                
            if (!isTransient || attempt === CONFIG.DOWNLOAD_ATTEMPTS) {
                return false;
            }
            await sleep(200 * attempt);
        }
    }
    return false;
}

// ---------------------------------------------------------------------------
// WIKIMEDIA COMMONS PUBLIC SEARCH API (NO KEY)
// ---------------------------------------------------------------------------
async function searchWikimediaCommons(query, isVideo = false) {
    try {
        const fileTypeQuery = isVideo ? "filetype:video" : "filetype:bitmap";
        const searchQuery = `${query} ${fileTypeQuery}`;
        const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=5&origin=*`;
        
        const res = await fetch(url, {
            headers: {
                "User-Agent": "VisualTubeSeeder/1.0 (contact@example.com)"
            }
        });
        if (!res.ok) return [];

        const data = await res.json();
        const searchResults = data?.query?.search || [];
        const files = [];

        for (const item of searchResults) {
            const title = item.title;
            // Query detailed URL of the file
            const urlQuery = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(title)}&origin=*`;
            const urlRes = await fetch(urlQuery, {
                headers: {
                    "User-Agent": "VisualTubeSeeder/1.0 (contact@example.com)"
                }
            });
            if (urlRes.ok) {
                const urlData = await urlRes.json();
                const pages = urlData?.query?.pages || {};
                const pageId = Object.keys(pages)[0];
                const fileUrl = pages[pageId]?.imageinfo?.[0]?.url;
                if (fileUrl) {
                    files.push({
                        url: fileUrl,
                        ext: path.extname(fileUrl).toLowerCase() || (isVideo ? ".mp4" : ".jpg")
                    });
                }
            }
        }
        return files;
    } catch (err) {
        logMessage(`  ⚠ Wikimedia Commons API search failed: ${err.message}`);
        return [];
    }
}

// ---------------------------------------------------------------------------
// INTERNET ARCHIVE PUBLIC SEARCH API (NO KEY)
// ---------------------------------------------------------------------------
async function searchInternetArchive(query, isVideo = false) {
    try {
        const mediatype = isVideo ? "movies" : "image";
        const url = `https://archive.org/advancedsearch.php?q=subject:(${encodeURIComponent(query)})+AND+mediatype:(${mediatype})&fl[]=identifier&rows=3&output=json`;

        const res = await fetch(url, {
            headers: {
                "User-Agent": "VisualTubeSeeder/1.0 (contact@example.com)"
            }
        });
        if (!res.ok) return [];

        const data = await res.json();
        const docs = data?.response?.docs || [];
        const files = [];

        for (const doc of docs) {
            const id = doc.identifier;
            // The metadata endpoint lists files for download
            const metaUrl = `https://archive.org/metadata/${id}`;
            const metaRes = await fetch(metaUrl, {
                headers: {
                    "User-Agent": "VisualTubeSeeder/1.0 (contact@example.com)"
                }
            });
            if (metaRes.ok) {
                const metaData = await metaRes.json();
                const fileList = metaData?.files || [];
                
                // Find matching file
                const match = fileList.find(f => {
                    const name = f.name.toLowerCase();
                    return isVideo ? name.endsWith(".mp4") : (name.endsWith(".jpg") || name.endsWith(".jpeg"));
                });
                
                if (match) {
                    files.push({
                        url: `https://archive.org/download/${id}/${match.name}`,
                        ext: path.extname(match.name).toLowerCase()
                    });
                }
            }
        }
        return files;
    } catch (err) {
        logMessage(`  ⚠ Internet Archive search failed: ${err.message}`);
        return [];
    }
}

// ---------------------------------------------------------------------------
// COORDINATOR PUBLIC DOWNLOAD
// ---------------------------------------------------------------------------
export async function downloadCorrelatedMedia(topic, type) {
    const isVideo = type === "video";
    const keywords = isVideo ? topic.videoSearchKeywords : topic.thumbnailSearchKeywords;
    const query = pickRandom(keywords) || topic.title;

    logMessage(`🔎 Searching public media for [${type.toUpperCase()}] topic: "${topic.title}" (query: "${query}")...`);

    // 1. Try Wikimedia Commons first
    let candidates = await searchWikimediaCommons(query, isVideo);
    
    // 2. Try Internet Archive secondary
    if (candidates.length === 0) {
        candidates = await searchInternetArchive(query, isVideo);
    }

    // 3. Fallback to stable curated pools
    if (candidates.length === 0) {
        logMessage(`  ⚠ Public APIs returned 0 results. Falling back to stable curated pool.`);
        const fallbackUrl = isVideo ? pickRandom(STABLE_VIDEO_POOL) : pickRandom(STABLE_IMAGE_POOL);
        candidates = [{
            url: fallbackUrl,
            ext: isVideo ? ".mp4" : ".jpg"
        }];
    }

    // Validate candidates list
    if (candidates.length === 0) {
        throw new Error(`Failed to find media candidate list for topic: ${topic.title}`);
    }

    const slug = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "");
    const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024; // 15MB video, 5MB image (Cloudinary limit)

    // Iterate through at most 2 candidates until one successfully downloads
    const activeCandidates = candidates.slice(0, 2);
    for (const candidate of activeCandidates) {
        const filename = `${slug}_${type}${candidate.ext}`;
        const destPath = path.join(CONFIG.TEMP_DIR, filename);

        logMessage(`  - Downloading candidate from: ${candidate.url}`);
        const ok = await downloadFile(candidate.url, destPath, maxSize);
        if (ok) {
            // Perform size validation check
            const stats = fs.statSync(destPath);
            if (stats.size >= 1000) {
                return destPath;
            } else {
                try { fs.unlinkSync(destPath); } catch (_) {}
                logMessage(`  ⚠ Downloaded file size too small (< 1KB), skipping candidate.`);
            }
        }
    }

    // Fallback to the stable pool if all candidates failed
    logMessage(`  ⚠ All candidates failed for topic: "${topic.title}". Falling back to stable pool.`);
    const fallbackUrl = isVideo ? pickRandom(STABLE_VIDEO_POOL) : pickRandom(STABLE_IMAGE_POOL);
    const fallbackExt = isVideo ? ".mp4" : ".jpg";
    const destPath = path.join(CONFIG.TEMP_DIR, `${slug}_${type}${fallbackExt}`);

    logMessage(`  - Downloading fallback from: ${fallbackUrl}`);
    const ok = await downloadFile(fallbackUrl, destPath, maxSize);
    if (!ok) {
        throw new Error(`Failed to download fallback media for: ${topic.title}`);
    }
    return destPath;
}
