import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    video: {
        type: mongoose.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: mongoose.Types.ObjectId,
        ref: "Comment"
    },
    likedBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// WHY DO WE NEED INDEXES?
// 1. Faster queries for like/unlike operations.
//    Example:
//    Like.findOne({ video: videoId, likedBy: userId })

// WHY UNIQUE COMPOUND INDEX?
// Business rule:
// A user can like a particular video only once.

// It also protects against race conditions.
// Example:
// Two like requests arrive almost simultaneously.
// Both check "Like exists?" and see "No".
// Without a unique index, both can insert duplicate Like documents.
// With a unique compound index, MongoDB allows only one insert.
// The second insert fails with:
// E11000 duplicate key error.

// Why NOT `unique: true` on `video`?
// -> Only one user could like a video.

// Why NOT `unique: true` on `likedBy`?
// -> A user could like only one video in total.

// Therefore, make the COMBINATION unique:
// { video: 1, likedBy: 1 }
likeSchema.index(
    { video: 1, likedBy: 1 },
    { unique: true,
        partialFilterExpression:{
            video:{$exists : true}
        }
     }
);

// avoid dupicate comment like by same user ....
likeSchema.index(
    { comment: 1, likedBy: 1 },
    { unique: true, // for preventing race condition...
        // creates index only if video exists | if multiple(likedBy and comment) => it can create duplicate (video,Likeby) index
        partialFilterExpression:{
            comment:{$exists:true}
        }
     }
);

// validation => only one of the (video or comment exists) | as user can like either comment or video
likeSchema.pre("validate", function () {
    const targets = [this.video, this.comment];

    const filledTargets = targets.filter(Boolean);

    if (filledTargets.length !== 1) {
        throw new Error("Like must belong to exactly one of: video, comment");
    }
});

export const Like = mongoose.model("Like",likeSchema);