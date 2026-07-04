import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    getPlaylistById,
    addVideoInPlaylist,
    removeVideoFromPlaylist,
    getAllUserPlaylists
} from "../controllers/playlist.controller.js";

const PlaylistRouter = Router();

// All playlist routes require authentication
PlaylistRouter.use(verifyJWT);

PlaylistRouter.route("/")
    .post(createPlaylist);

PlaylistRouter.route("/user/:userId")
    .get(getAllUserPlaylists);

PlaylistRouter.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

PlaylistRouter.route("/:playlistId/video/:videoId")
    .post(addVideoInPlaylist)
    .delete(removeVideoFromPlaylist);

export default PlaylistRouter;