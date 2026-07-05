import mongoose,{Schema} from "mongoose";


const videoSchema=new Schema(
    {
        videoFile:{
            type:String,
            required:true,
        },
        thumbnail:{
            type:String,
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

videoSchema.index(
    {
        title: "text",
        description: "text",
        tags: "text"
    },
    {
        weights: {
            title: 10,
            tags: 5,
            description: 2
        },
        name: "video_text_search"
    }
);

export const Video = mongoose.model("Video",videoSchema)