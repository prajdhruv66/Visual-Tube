import express from 'express';
import dotenv from 'dotenv'
import connect_mongodb from './db/index.js';

dotenv.config()

connect_mongodb()
const app = express()