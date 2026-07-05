import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    content:{
        type:String,
        required:true,
        trim:true
    },
    video:{
        type:mongoose.Types.ObjectId,
        ref:'Video',
        required:true,
        index:true
    },
    owner:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true,
        index:true
    }
},{timestamps:true})


export const Comment = mongoose.model("Comment",commentSchema)