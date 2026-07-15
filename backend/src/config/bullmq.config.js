const bullConnection = {
    connectionString:
        process.env.REDIS_URL ||
        "redis://localhost:6379"
};

export {bullConnection}