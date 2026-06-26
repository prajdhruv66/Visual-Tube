import dotenv from 'dotenv'
import connect_mongodb from './db/index.js';
import { app } from './app.js';

dotenv.config()

connect_mongodb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`app is connected localhost:${process.env.PORT || 8000}`);
    })
})
.catch((err)=>{
    console.log('MONGODB CONNECTION FAILED!! :',err);
})
