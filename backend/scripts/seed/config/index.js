import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Roots
const PROJECT_ROOT = path.resolve(__dirname, "../../../.."); // Capstone_project/
const WORKSPACE_ROOT = path.join(PROJECT_ROOT, ".seed-workspace");

// Parse arguments (e.g., --users=5 --videos=3)
const getArgValue = (flag) => {
    const arg = process.argv.find(a => a.startsWith(`${flag}=`));
    return arg ? parseInt(arg.split("=")[1], 10) : null;
};

export const CONFIG = {
    // Database reset ordering
    CLEAR: process.argv.includes("--clear") || process.env.SEED_CLEAR === "true",
    
    // Scale parameters
    CREATOR_COUNT: getArgValue("--users") || 50,
    VIEWER_COUNT: getArgValue("--viewers") || 10,
    VIDEOS_PER_CREATOR: getArgValue("--videos") || 20,
    PLAYLISTS_PER_CREATOR: 3,
    
    // Authentication
    DEFAULT_PASSWORD: "Password@123",
    
    // Directory mapping
    WORKSPACE_ROOT,
    TEMP_DIR: path.join(WORKSPACE_ROOT, "temp"),
    LOG_DIR: path.join(WORKSPACE_ROOT, "logs"),
    CACHE_DIR: path.join(WORKSPACE_ROOT, "metadata-cache"),
    REPORT_DIR: path.join(WORKSPACE_ROOT, "reports"),
    
    // Download parameters
    DOWNLOAD_CONCURRENCY: 3,
    DOWNLOAD_ATTEMPTS: 3,
    
    // Views range (FR-12: intentionally low, 20-500)
    MIN_VIEWS: 20,
    MAX_VIEWS: 500,
};
