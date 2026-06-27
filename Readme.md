# Capstone Project

## Initial Folder Structure

- `package.json`
- `Readme.md`
- `public/`
  - `temp/`
- `src/`
  - `app.js`
  - `constants.js`
  - `index.js`
  - `controllers/`
  - `db/`
  - `middlewares/`
  - `models/`
  - `utils/`

## Why use Prettier?

Prettier is a code formatter that enforces a consistent style across the project.
Using Prettier helps avoid small formatting conflicts during merges, so team members can focus on actual code changes instead of whitespace, indentation, or line-break differences.

> Benefits:
> - keeps formatting consistent across files
> - reduces merge conflicts caused by formatting
> - saves time on code review for style issues
> - improves readability and maintainability

## Middleware used

- `cors` — allows requests from allowed origins, using `process.env.CORS_ORIGIN`
- `express.static` — serves public assets from the `public/` folder
- `express.json()` — parses JSON request bodies
- `express.urlencoded({ extended: true })` — parses URL-encoded form data from forms

## Async handler utility

- `src/utils/asyncHandler.js` wraps async route handlers so errors are passed to Express with `next(err)` instead of repeating `try/catch` in every handler.

## API error and response classes

Using custom classes like `ApiError` and `ApiResponse` keeps responses consistent and easy to handle across the app.

- `ApiError` centralizes error status codes and messages in one format.
- `ApiResponse` standardizes successful responses with a code, payload, and message.

Example:

```js
// error case
if (!user) {
    throw new ApiError(404, "User not found")
}

// success case
return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User fetched successfully"
        )
    )
```

This makes error handling and client responses predictable, easier to test, and simpler to extend later.

## Mongoose pipeline operation

- A Mongoose pipeline uses MongoDB aggregation stages to transform and filter documents in a sequence.
- This is useful for complex queries like grouping, projecting, sorting, or joining data.
- In this project, `src/models/video.model.js` installs `mongoose-aggregate-paginate-v2`, which can build aggregation stages before paging results.

## Mongoose pagination

- Pagination splits large result sets into pages so the app only fetches a limited number of documents at once.
- It improves performance and reduces memory use for list endpoints.
- Here the project uses `mongoose-aggregate-paginate-v2` with the video model to return paged aggregation results.

## Mongoose middleware hooks

- Mongoose hooks are functions that run before or after model operations like `save`, `validate`, or `remove`.
- They let you add pre-processing or validation logic directly on the schema.
- Smallest syntax example:

```js
UserSchema.pre("save", async function (next) {
  // runs before saving a user document
  next()
})
```

- This project uses a pre-save hook in `src/models/user.model.js` to run logic before a user is saved.

## Custom instance methods in Mongoose documents

- Custom instance methods are functions defined on `schema.methods` and available on each document.
- They keep model behavior close to the data, so you can call `user.isPasswordCorrect(...)` or `user.generateAccessToken()`.
- Smallest syntax example:

```js
UserSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`
}
```

- In the project, `src/models/user.model.js` defines methods like `isPasswordCorrect` and `generateAccessToken`.

## Access token and refresh token

- Access token: a short-lived JWT used to authenticate API requests.
- Refresh token: a longer-lived JWT used to request a new access token after the old one expires.
- Keeping them separate improves security by limiting how long a leaked access token remains valid and allowing refreshes without forcing the user to log in again.
- The project defines both in `src/models/user.model.js` with `jsonwebtoken`.}

## File Upload Flow

This project uses **Multer** for handling file uploads and **Cloudinary** for cloud storage.

### Upload Flow

```
Client
  |
  | multipart/form-data
  ↓
Multer Middleware (diskStorage)
  |
  | Temporary local storage
  ↓
Cloudinary Upload Utility
  |
  ↓
Cloudinary Cloud Storage
  |
  ↓
Store Cloudinary URL in Database
```

### Why use Multer `diskStorage`?

Files are first stored temporarily on the server using Multer's `diskStorage` before uploading to Cloudinary.

Reasons:
- Provides a temporary file path that can be passed to Cloudinary.
- Prevents keeping large files in server memory (unlike `memoryStorage`).
- Allows file processing or validation before cloud upload.
- Makes upload handling more reliable for larger files.

After successful upload, the temporary local file should be removed to avoid unnecessary disk usage.

### Cloudinary Upload Utility

The utility handles:
- Uploading files from local temporary storage to Cloudinary.
- Supporting different file types using `resource_type: "auto"`.
- Cleaning up local files if the upload fails.

Flow:

```
Local File
    |
    ↓
cloudinary.uploader.upload()
    |
    ↓
Cloudinary URL
    |
    ↓
Database Storage
```
<div style="overflow-x:auto">

## Controller Logic Flow

### Video Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `getAllVideos` | Get videos with filtering, sorting and pagination | 1. Get query params (`page`, `limit`, `query`, `sortBy`, `sortType`, `userId`) <br> 2. Build aggregation pipeline based on filters <br> 3. Apply search, sorting and pagination <br> 4. Fetch videos with required user details <br> 5. Return videos using ApiResponse |
| `publishAVideo` | Upload and publish a video | 1. Get title and description from request body <br> 2. Get video file and thumbnail from multer files <br> 3. Validate required fields and files <br> 4. Upload video and thumbnail to Cloudinary <br> 5. Create video object with URLs and user reference <br> 6. Save video in database <br> 7. Return created video using ApiResponse <br> 8. Throw ApiError if upload/database operation fails |
| `getVideoById` | Get video details by ID | 1. Get videoId from params <br> 2. Find video using aggregation/populate <br> 3. Include owner details and related information <br> 4. Validate video exists <br> 5. Return video data |
| `updateVideo` | Update video information | 1. Get videoId from params <br> 2. Get updated title/description/thumbnail data <br> 3. Verify video ownership <br> 4. Upload new thumbnail if provided <br> 5. Update video document <br> 6. Return updated video |
| `deleteVideo` | Delete a video | 1. Get videoId from params <br> 2. Verify video ownership <br> 3. Delete video from database <br> 4. Remove Cloudinary assets if required <br> 5. Return success response |
| `togglePublishStatus` | Toggle video publish state | 1. Get videoId from params <br> 2. Find video <br> 3. Reverse `isPublished` status <br> 4. Save changes <br> 5. Return updated status |

---

### Tweet Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `createTweet` | Create tweet | 1. Get tweet content from request body <br> 2. Validate content <br> 3. Create tweet with user reference <br> 4. Save tweet in database <br> 5. Return created tweet |
| `getUserTweets` | Get user tweets | 1. Get userId <br> 2. Find tweets created by user <br> 3. Apply sorting/pagination if required <br> 4. Return tweets |
| `updateTweet` | Update tweet | 1. Get tweetId <br> 2. Validate tweet ownership <br> 3. Update tweet content <br> 4. Return updated tweet |
| `deleteTweet` | Delete tweet | 1. Get tweetId <br> 2. Verify ownership <br> 3. Delete tweet <br> 4. Return success response |

---

### Subscription Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `toggleSubscription` | Subscribe/unsubscribe channel | 1. Get channelId <br> 2. Check existing subscription <br> 3. If exists remove subscription else create subscription <br> 4. Return updated subscription state |
| `getUserChannelSubscribers` | Get channel subscribers | 1. Get channelId <br> 2. Find subscribers using aggregation <br> 3. Populate subscriber details <br> 4. Return subscriber list |
| `getSubscribedChannels` | Get subscribed channels | 1. Get subscriberId <br> 2. Find channels user subscribed to <br> 3. Populate channel details <br> 4. Return channel list |

---

### Playlist Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `createPlaylist` | Create playlist | 1. Get playlist name and description <br> 2. Validate input <br> 3. Create playlist with user reference <br> 4. Save playlist <br> 5. Return playlist |
| `getUserPlaylists` | Get user playlists | 1. Get userId <br> 2. Find playlists created by user <br> 3. Populate videos if required <br> 4. Return playlists |
| `getPlaylistById` | Get playlist details | 1. Get playlistId <br> 2. Find playlist <br> 3. Populate owner and videos <br> 4. Return playlist |
| `addVideoToPlaylist` | Add video | 1. Get playlistId and videoId <br> 2. Verify playlist ownership <br> 3. Check video existence <br> 4. Add video reference <br> 5. Return updated playlist |
| `removeVideoFromPlaylist` | Remove video | 1. Get playlistId and videoId <br> 2. Verify ownership <br> 3. Remove video reference <br> 4. Return updated playlist |
| `deletePlaylist` | Delete playlist | 1. Get playlistId <br> 2. Verify ownership <br> 3. Delete playlist <br> 4. Return success response |
| `updatePlaylist` | Update playlist | 1. Get playlistId <br> 2. Get updated fields <br> 3. Verify ownership <br> 4. Update playlist <br> 5. Return updated playlist |

---

### Like Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `toggleVideoLike` | Like/unlike video | 1. Get videoId <br> 2. Check existing like <br> 3. Remove like if exists else create like <br> 4. Return updated status |
| `toggleCommentLike` | Like/unlike comment | 1. Get commentId <br> 2. Check existing like <br> 3. Toggle like state <br> 4. Return response |
| `toggleTweetLike` | Like/unlike tweet | 1. Get tweetId <br> 2. Check existing like <br> 3. Toggle like state <br> 4. Return response |
| `getLikedVideos` | Get liked videos | 1. Get current user <br> 2. Find likes created by user <br> 3. Populate video details <br> 4. Return liked videos |

---

### Healthcheck Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `healthcheck` | Check API availability | 1. Create health response object <br> 2. Return OK status <br> 3. Send ApiResponse |

---

### Dashboard Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `getChannelStats` | Get channel analytics | 1. Get channel/user id <br> 2. Aggregate total videos, views, subscribers and likes <br> 3. Calculate statistics <br> 4. Return dashboard data |
| `getChannelVideos` | Get channel videos | 1. Get channel id <br> 2. Find uploaded videos <br> 3. Apply sorting/pagination <br> 4. Return videos |

---

### Comment Controller

| Controller | Purpose | Logic Flow |
|---|---|---|
| `getVideoComments` | Get comments of video | 1. Get videoId <br> 2. Get pagination values <br> 3. Fetch comments using aggregation <br> 4. Populate user details <br> 5. Return comments |
| `addComment` | Add comment | 1. Get comment text <br> 2. Validate content <br> 3. Create comment with user and video reference <br> 4. Save comment <br> 5. Return comment |
| `updateComment` | Update comment | 1. Get commentId <br> 2. Verify ownership <br> 3. Update comment text <br> 4. Return updated comment |
| `deleteComment` | Delete comment | 1. Get commentId <br> 2. Verify ownership <br> 3. Delete comment <br> 4. Return success response |

</div>