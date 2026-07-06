import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "../config/index.js";

// Ensure all seed dirs exist on utility startup
export function initSeedWorkspace() {
    [CONFIG.WORKSPACE_ROOT, CONFIG.TEMP_DIR, CONFIG.LOG_DIR, CONFIG.CACHE_DIR, CONFIG.REPORT_DIR].forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

const LOG_FILE = path.join(CONFIG.LOG_DIR, "seed.log");

export function logMessage(msg) {
    initSeedWorkspace();
    const formatted = `[INFO] ${new Date().toISOString()} - ${msg}`;
    console.log(formatted);
    fs.appendFileSync(LOG_FILE, `${formatted}\n`);
}

export function logError(msg, err) {
    initSeedWorkspace();
    const errStr = err?.stack || (err && typeof err === 'object' ? JSON.stringify(err) : err);
    const formatted = `[ERROR] ${new Date().toISOString()} - ${msg} ${errStr}`;
    console.error(formatted);
    fs.appendFileSync(LOG_FILE, `${formatted}\n`);
}

export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function pickRandom(array) {
    if (!array || array.length === 0) return undefined;
    return array[randInt(0, array.length - 1)];
}

export function randomSubset(array, min, max) {
    if (!array || array.length === 0) return [];
    const count = Math.min(array.length, randInt(min, max));
    return shuffle(array).slice(0, count);
}

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "");
}
