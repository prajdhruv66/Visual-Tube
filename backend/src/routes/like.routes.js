import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, toggleVidoeLike } from "../controllers/like.controller.js";

const likeRouter = Router();

likeRouter.route('/video/:videoId').post(verifyJwt,toggleVidoeLike);
likeRouter.route('/comment/:commentId').post(verifyJwt,toggleCommentLike)

export default likeRouter