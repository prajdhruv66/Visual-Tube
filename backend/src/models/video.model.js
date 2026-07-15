import mongoose,{Schema} from "mongoose";


const videoSchema = new Schema(
{
    // Original video (source of truth)
    videoFile:{
        type:String,
        required:true
    },

    // NEW
    availableResolutions:[
        {
            resolution:{
                type:String,
                enum:["360p","480p","720p","1080p"]
            },

            url:{
                type:String
            },

            public_id:{
                type:String
            }
        }
    ],

    processingStatus:{
        type:String,
        enum:[
            "queued",
            "processing",
            "published",
            "failed"
        ],
        default:"queued"
    },

    title:{
        type:String,
        required:true
    },

    description:{
        type:String
    },

    thumbnail:{
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
        default:false
    },

    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }

},
{timestamps:true})

export const Video = mongoose.model("Video",videoSchema)