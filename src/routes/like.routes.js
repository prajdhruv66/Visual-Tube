import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { toggleCommentLike, toggleVidoeLike } from "../controllers/like.controller";

const likeRouter = Router();

likeRouter.route('/:videoId').post(verifyJwt,toggleVidoeLike);
likeRouter.route('/:commentId').post(verifyJwt,toggleCommentLike)

export default likeRouter