import redis from "../config/redis.config.js";

class RedisService {
        #initialized = false;
    connect() {

        if (this.#initialized) return;
        this.#initialized = true;

        redis.on("connect", () => {
            console.log("Redis Connected");
        });

        redis.on("ready", () => {
            console.log("Redis Ready");
        });

        redis.on("error", (err) => {
            console.error("Redis Error:", err);
        });

        redis.on("reconnecting", () => {
            console.log("Redis Reconnecting...");
        });

        redis.on("close", () => {
            console.log("Redis Connection Closed");
        });
    }

    async disconnect() {
        if(redis.status === "end") return;
        await redis.quit();
        console.log("Redis Disconnected");
    }

    getClient() {
        return redis;
    }
}

export default new RedisService();