import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRouter from './routes/user.routes.js'

const app = express()

// all the middlewares
app.use(cors({origin : process.env.CORS_ORIGIN})) // checks origin of request is allowed ...
app.use(express.static('public')) // keeps public data like svgs,img etc
app.use(express.json()) // use to handle json data
app.use(express.urlencoded({extended:true})) // use to handle header data (like from forms)
app.use(cookieParser()) // parse cookies from requests

// routes
app.use('/api/v1', userRouter)

export { app }