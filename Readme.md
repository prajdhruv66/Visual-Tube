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

| Controller | Purpose | Logic Flow |
|---|---|---|
| `publishAVideo` | Upload and publish video | 1. Get title and description from request body <br> 2. Get video file and thumbnail from multer uploaded files <br> 3. Validate required fields <br> 4. Upload video and thumbnail to Cloudinary <br> 5. Create video document with uploaded URLs and user reference <br> 6. Save video in database <br> 7. Return created video using ApiResponse <br> 8. Throw ApiError if upload/database operation fails |
| `getVideoById` | Get single video details | 1. Get videoId from params <br> 2. Find video by ID <br> 3. Populate required user details <br> 4. Validate video existence <br> 5. Return video details using ApiResponse |
| `updateVideo` | Update video metadata | 1. Get videoId from params <br> 2. Get updated title/description from body <br> 3. Check video ownership <br> 4. Update video fields <br> 5. Return updated video |
| `deleteVideo` | Delete video | 1. Get videoId <br> 2. Verify video ownership <br> 3. Delete video from database <br> 4. Remove related Cloudinary files if required <br> 5. Return success response |
| `togglePublishStatus` | Toggle video visibility | 1. Get videoId <br> 2. Find video <br> 3. Reverse isPublished status <br> 4. Save changes <br> 5. Return updated status |

</div>