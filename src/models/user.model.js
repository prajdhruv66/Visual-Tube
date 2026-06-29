import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"

const UserSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            lowercase:true,
            trime:true,
            unique:true,
            index:true //optimized for repeatative searching
        },
        email:{
            type:String,
            required:true,
            trim:true,
            unique:true,
            lowercase:true
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, // cloudinary url
            required:true,
        },
        coverImage:{
            type:String,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,'Password is required']
        },
        refreshToken:{
            type:String
        }
    },
    {
        timestamps:true
    }
)


/* middleware hooks
=> why hooks: as it is connected to schema
=> functions that run automatically before or after certain database operations.
*/
UserSchema.pre("save", async function() {
    // isModified("field") : checks if a schema field is modified
    if (!this.isModified("password")) return

    this.password = await bcrypt.hash(this.password, 10)
})

// custom methods attached to schema
UserSchema.methods.isPasswordCorrect = async function(password){
return await bcrypt.compare(password,this.password)
}

// both are jwt tokens
UserSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
UserSchema.methods.generateRefershToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.REFERESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFERESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",UserSchema)