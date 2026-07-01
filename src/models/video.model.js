import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";
import { ApiError } from "../utils/apiErrors";

const videoSchema=new Schema(
    {
        videoFile:{
            type:String,
            required:true,
        },
        thumbnail:{
            tyep:String,
            required:true,
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number, 
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        tags:[
            {
                type:String,
                tolowercase:true,
                trim:true
            }
        ]
    },
    {
        timestamps:true
    }
)


export const Video = mongoose.model("Video",videoSchema)