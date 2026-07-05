// multer.middleware.js

import multer from "multer"
import { ApiError } from "../utils/apiErrors.js"


const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }

})



const fileFilter = (req,file,cb)=>{

    const imageFields = [
        "avatar",
        "coverImage",
        "thumbnail"
    ]

    const videoFields = [
        "video"
    ]

    // 1. Check image fields
    if(imageFields.includes(file.fieldname)){

        if(file.mimetype.startsWith("image/")){
            cb(null,true)
        }
        else{
            cb(
                new ApiError(
                    400,
                    `${file.fieldname} only accepts images`
                ),
                false
            )
        }
    }

    // 2. Check video field
    else if(videoFields.includes(file.fieldname)){
        if(file.mimetype.startsWith("video/")){
            cb(null,true)
        }
        else{
            cb(
                new ApiError(
                    400,
                    "video field only accepts videos"
                ),
                false
            )
        }
    }

    // 3. Reject unknown fields
    else{
        cb(
            new ApiError(
                400,
                "Invalid file field"
            ),
            false
        )
    }
}



export const upload = multer({
    storage,
    fileFilter,
    limits:{
        fileSize:100 * 1024 * 1024 // 100MB
    }
})