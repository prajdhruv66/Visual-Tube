import redis from "../config/redis.config.js";
import { ApiError } from "../utils/apiErrors.js";

/**
 * Redis-backed Rate Limiter Middleware
 * @param {string} keyPrefix Unique namespace prefix (e.g., 'login', 'register', 'upload')
 * @param {number} limit Maximum number of requests allowed in the duration window
 * @param {number} durationSeconds Duration window in seconds
 */
export const rateLimiter = (keyPrefix, limit, durationSeconds) => {
    return async (req, res, next) => {
        // Nginx passes the real client IP in x-forwarded-for header
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Clean IP to be a clean Redis key suffix
        const cleanIp = ip ? ip.replace(/:\s*/g, '_') : 'unknown';
        const key = `rate-limit:${keyPrefix}:${cleanIp}`;

        try {
            // Redis INCR returns the value after the increment
            const requests = await redis.incr(key);
            
            if (requests === 1) {
                // Set expiry time window on key initialization
                await redis.expire(key, durationSeconds);
            }

            if (requests > limit) {
                throw new ApiError(429, `Too many requests for ${keyPrefix}. Please try again after some time.`);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
