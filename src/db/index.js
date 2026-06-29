import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connect_mongodb = async ()=>{
    try {
        const connection_instance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n MongoDB connected DB_HOST:\n${connection_instance.connection.host}`)
        return connection_instance
    } catch (error) {
        console.log(`error in connect_mongodb: ${error}`)
        process.exit(1)
    }
}


export default connect_mongodb;