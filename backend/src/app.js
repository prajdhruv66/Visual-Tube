import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import fs from 'node:fs'
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.route.js'
import SubscriptionRouter from './routes/subscription.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import PlaylistRouter from './routes/playlist.routes.js'

const app = express()


// all the middlewares
app.use(cors({origin : process.env.CORS_ORIGIN, credentials:true})) // checks origin of request is allowed ...
app.use(express.static('public')) // keeps public data like svgs,img etc
app.use(express.json()) // use to handle json data
app.use(express.urlencoded({extended:true})) // use to handle header data (like from forms)
app.use(cookieParser()) // parse cookies from requests

// routes
app.use('/api/v1/user', userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscription", SubscriptionRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/playlist",PlaylistRouter)

app.get("/", (req, res) => {
    res.json({
        message: "Visual-Tube Backend Running"
    });
});

// global error handler middleware
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong...";

    // Handle Multer upload errors
    if (err.name === 'MulterError' || err.code?.startsWith('LIMIT_')) {
        statusCode = 413; // Payload Too Large
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = "File too large. The maximum size allowed is 100MB.";
        } else {
            message = `File upload error: ${err.message || err.code}`;
        }
    }

    // Clean up temporary files on request failure to avoid orphans
    if (req.file) {
        try {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        } catch (e) {
            console.error("Error cleaning up temp file in global handler:", e);
        }
    }
    if (req.files) {
        try {
            const filesObj = req.files;
            Object.keys(filesObj).forEach(key => {
                const files = filesObj[key];
                if (Array.isArray(files)) {
                    files.forEach(file => {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    });
                }
            });
        } catch (e) {
            console.error("Error cleaning up temp files in global handler:", e);
        }
    }

    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors: err.errors || []
    });
});

export { app }