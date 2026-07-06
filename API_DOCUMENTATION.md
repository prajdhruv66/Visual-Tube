# API Documentation & Routes Reference

This document maps all API endpoints available on the Visual-Tube backend.

* **Route Prefix**: `/api/v1`
* **Content-Type**: `application/json` (except file uploads which use `multipart/form-data`)

---

## 1. User & Channel Module (`/user`)

| HTTP Method | Endpoint | Auth Required | Description | Request Payload | Response Payload (data) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/user/register` | No | Registers a new user. | `multipart/form-data`<br>• `fullname` (text)<br>• `email` (text)<br>• `username` (text)<br>• `password` (text)<br>• `avatar` (file)<br>• `coverImage` (optional file) | `{ _id, username, email, fullname, avatar, coverImage }` |
| `POST` | `/user/login` | No | Log in and set cookies. | `{ "username": "...", "password": "..." }` or `{ "email": "...", "password": "..." }` | `{ user: { _id, username, email, fullname, avatar, coverImage }, accessToken, refreshToken }` |
| `POST` | `/user/logout` | **Yes** | Logs out and clears session. | None | `{ message: "Logged out successfully" }` |
| `POST` | `/user/regenerate-tokens` | No | Refreshes expired sessions. | Cookies: `refreshToken` | `{ accessToken, refreshToken }` |
| `GET` | `/user/me` | **Yes** | Gets current user profile. | Cookies: `accessToken` | `{ _id, username, email, fullname, avatar, coverImage }` |
| `PATCH` | `/user/me` | **Yes** | Updates user details. | `{ "fullname": "...", "email": "..." }` | `{ _id, username, email, fullname, avatar, coverImage }` |
| `PATCH` | `/user/avatar` | **Yes** | Updates user avatar. | `multipart/form-data`<br>• `avatar` (file) | `{ _id, username, email, fullname, avatar, coverImage }` |
| `PATCH` | `/user/cover-image` | **Yes** | Updates user cover image. | `multipart/form-data`<br>• `coverImage` (file) | `{ _id, username, email, fullname, avatar, coverImage }` |
| `GET` | `/user/c/:username` | **Yes** | Fetches channel profile. | None | `{ _id, username, fullname, avatar, coverImage, subscribersCount, channelsSubscribedToCount, isSubscribed }` |
| `GET` | `/user/history` | **Yes** | Gets user's watch history. | None | `[ { _id, title, thumbnail, duration, views, owner: { username, fullname, avatar } } ]` |

---

## 2. Videos Module (`/videos`)

| HTTP Method | Endpoint | Auth Required | Description | Request Payload | Response Payload (data) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/videos/` | **Yes** | Uploads a new video. | `multipart/form-data`<br>• `title` (text)<br>• `description` (text)<br>• `tags` (text / string[])<br>• `isPublished` (text: `"true"`/`"false"`)<br>• `video` (file)<br>• `thumbnail` (file) | `{ _id, title, description, videoFile, thumbnail, duration, views, isPublished, owner: { username, avatar } }` |
| `GET` | `/videos/get-feed` | **Yes** | Gets paginated video list. | Query Params:<br>• `page` (number)<br>• `limit` (number)<br>• `search` (text)<br>• `mode` (`"trending"`/`"newest"`)<br>• `channelId` (optional) | `{ metadata: [ { totalVideos: 45 } ], videos: [ ... ], page: 1, limit: 10 }` |
| `GET` | `/videos/personalised` | **Yes** | Gets recommendations. | Query Params: `page`, `limit` | `{ metadata: [ { totalVideos: 5 } ], videos: [ ... ], page: 1, limit: 10 }` |
| `GET` | `/videos/:videoId` | **Yes** | Gets video details by ID. | None | `{ _id, title, description, videoFile, thumbnail, duration, views, owner: { username, fullname, avatar, subscribersCount }, likesCount, isLiked }` |
| `PATCH` | `/videos/:videoId` | **Yes** | Updates video metadata. | `{ "title": "...", "description": "...", "tags": "..." }` | `{ _id, title, description, thumbnail, duration, views }` |
| `DELETE` | `/videos/:videoId` | **Yes** | Deletes a video. | None | `{ message: "Video deleted successfully" }` |
| `PATCH` | `/videos/:videoId/thumbnail` | **Yes** | Updates video thumbnail. | `multipart/form-data`<br>• `thumbnail` (file) | `{ _id, title, thumbnail, duration }` |
| `POST` | `/videos/:videoId/watch` | **Yes** | Registers a video view. | None | `{ message: "Watch registered successfully" }` |
| `PATCH` | `/videos/:videoId/publish` | **Yes** | Toggles publish status. | `{ "isPublished": true/false }` | `{ _id, title, isPublished }` |
| `GET` | `/videos/:videoId/likes` | **Yes** | Gets video likes counts. | None | `{ likesCount: 42, isLiked: true }` |

---

## 3. Subscriptions Module (`/subscription`)

| HTTP Method | Endpoint | Auth Required | Description | Request Payload | Response Payload (data) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/subscription/:channelId` | **Yes** | Toggles follow status. | None | `{ isSubscribed: true/false }` |
| `GET` | `/subscription/subscription` | **Yes** | Gets subscribed channels. | None | `[ { _id, username, fullname, avatar, subscribersCount } ]` |

---

## 4. Comments Module (`/comments`)

| HTTP Method | Endpoint | Auth Required | Description | Request Payload | Response Payload (data) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/comments/video/:videoId` | **Yes** | Gets video comments. | Query Params: `page`, `limit` | `{ metadata: [ { totalComments: 2 } ], comments: [ ... ], page: 1, limit: 20 }` |
| `POST` | `/comments/video/:videoId` | **Yes** | Adds a comment to video. | `{ "content": "Great video!" }` | `{ _id, content, video, owner: { username, fullname, avatar }, likesCount: 0, isLiked: false }` |
| `PATCH` | `/comments/:commentId` | **Yes** | Edits a comment content. | `{ "content": "Edited content" }` | `{ _id, content, video, owner: { username, fullname, avatar }, likesCount: 1, isLiked: true }` |
| `DELETE` | `/comments/:commentId` | **Yes** | Deletes a comment. | None | `{ message: "Comment deleted successfully" }` |

---

## 5. Likes Module (`/like`)

| HTTP Method | Endpoint | Auth Required | Description | Request Payload | Response Payload (data) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/like/video/:videoId` | **Yes** | Likes/unlikes a video. | None | `{ liked: true/false }` |
| `POST` | `/like/comment/:commentId` | **Yes** | Likes/unlikes comment. | None | `{ liked: true/false }` |

---

## 6. Playlists Module (`/playlist`)

| HTTP Method | Endpoint | Auth Required | Description | Request Payload | Response Payload (data) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/playlist/` | **Yes** | Creates a new playlist. | `{ "name": "Favorites", "description": "My top list" }` | `{ _id, name, description, owner, videos: [] }` |
| `GET` | `/playlist/user/:userId` | **Yes** | Gets all user playlists. | None | `[ { _id, name, description, videos: [ { _id, thumbnail, title } ], createdAt, updatedAt } ]` |
| `GET` | `/playlist/:playlistId` | **Yes** | Gets playlist details. | None | `{ _id, name, description, owner: { username, fullname, avatar }, videos: [ ... ] }` |
| `PATCH` | `/playlist/:playlistId` | **Yes** | Updates name/description. | `{ "name": "New name", "description": "New description" }` | `{ _id, name, description }` |
| `DELETE` | `/playlist/:playlistId` | **Yes** | Deletes a playlist. | None | `{ message: "Playlist deleted successfully" }` |
| `POST` | `/playlist/:playlistId/video/:videoId` | **Yes** | Adds video to playlist. | None | `{ message: "Video added to playlist" }` |
| `DELETE` | `/playlist/:playlistId/video/:videoId` | **Yes** | Removes video. | None | `{ message: "Video removed from playlist" }` |
