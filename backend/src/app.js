import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
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
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong...";
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors: err.errors || []
    });
});

export { app }