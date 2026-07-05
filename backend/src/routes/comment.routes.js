import { Router } from "express";
import {
    addComment,
    deleteComment,
    editComment,
    getVideoComments
} from "../controllers/comment.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const commentRouter = Router();

// Get all comments of a video
commentRouter.route("/video/:videoId")
    .get(verifyJwt, getVideoComments);

// Add a comment to a video
commentRouter.route("/video/:videoId")
    .post(verifyJwt, addComment);

// Edit a comment
commentRouter.route("/:commentId")
    .patch(verifyJwt, editComment);

// Delete a comment
commentRouter.route("/:commentId")
    .delete(verifyJwt, deleteComment);

export default commentRouter;