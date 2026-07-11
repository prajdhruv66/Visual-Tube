import dotenv from 'dotenv'
import connect_mongodb from './config/index.js';
import { app } from './app.js';
import redisService from './services/redis.service.js';
import mongoose from 'mongoose';

dotenv.config()

redisService.connect()
let server;
connect_mongodb()
.then(async()=>{

    server = app.listen(process.env.PORT || 8000,()=>{
        console.log(`app is connected localhost:${process.env.PORT || 8000}`);
    })
})
.catch((err)=>{
    console.log('MONGODB CONNECTION FAILED!! :',err);
})

const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down...`);

    if (!server) {
        await redisService.disconnect();
        await mongoose.connection.close();
        process.exit(0); // exit 0 => os => process completed | exit 1 => os => something went wrong
    }

    server.close(async () => {
        await redisService.disconnect();
        await mongoose.connection.close();

        process.exit(0);
    });
};

// SIGINT: signal when server stops
// SIGTERM: signal when docker stops
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

