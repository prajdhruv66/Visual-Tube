import {Queue} from 'bullmq'
import { bullConnection } from '../config/bullmq.config.js'

const videoQueue = new Queue(
    'video-processing',
    {
        connection:bullConnection
    }
);

export {videoQueue}