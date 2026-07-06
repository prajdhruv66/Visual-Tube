# File Upload Architecture

Visual-Tube uses a server-mediated file upload architecture combining **Multer** (for parsing incoming multipart/form-data requests) and **Cloudinary** (for cloud media hosting and delivery). 

---

## 1. System Topology

```
+------------------+     Multipart File Upload     +--------------------+
|  React Client    | ----------------------------> |   Express Backend  |
+------------------+                               +--------------------+
                                                             |
                                                     1. Save to disk
                                                             v
+------------------+      Upload Stream/Buffer     +--------------------+
|  Cloud Media     | <---------------------------- |  ./public/temp/    |
|  (Cloudinary)    |                               +--------------------+
+------------------+                                         |
                                                     2. Unlink/Cleanup
                                                             v
                                                   [ File Deleted from Host ]
```

---

## 2. File Upload Sequence

### Step 1: Request Interception via Multer
When a user submits a form (e.g., uploading a video or updating an avatar):
1. The frontend encodes the payload as `multipart/form-data`.
2. The route intercepts the request with the `upload` middleware:
   * Single file: `upload.single("avatar")`
   * Multiple files: `upload.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }])`
3. Multer inspects the mime types using `fileFilter`:
   * Images (`avatar`, `coverImage`, `thumbnail`) must match `/^image\//`.
   * Videos (`video`) must match `/^video\//`.
4. If valid, Multer writes the streams to the server's local disk directory `./public/temp` using original filenames.
5. Multer appends file metadata (local paths, field names, sizes) to `req.file` or `req.files`.

### Step 2: Uploading to Cloudinary
Inside the controller:
1. The controller retrieves the local filepath from `file.path`.
2. The controller calls the utility function `uploadOnCloudinary(localFilePath)`.
3. Cloudinary's SDK uploads the file using:
   ```javascript
   cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })
   ```
   * Setting `resource_type: "auto"` allows Cloudinary to dynamically determine if the asset is an image or video, performing compression and format optimizations automatically.
4. On success, Cloudinary returns a JSON payload containing the public URL, secure URL, public ID, asset size, and duration (for video files).

### Step 3: Temporary Filesystem Cleanup
To prevent the application server's disk storage from filling up:
1. **Successful Upload**: Once the upload completes, the local file is unlinked from the server's file system synchronously using `fs.unlinkSync(localFilePath)` before returning the response.
2. **Failed Upload**: If an exception occurs (e.g., connection timeout to Cloudinary or schema validation failure), the `catch` block intercepts the exception, deletes the local file using `fs.unlinkSync(localFilePath)` to prevent orphaned files, and throws an API error.

---

## 3. Storage Cleanup & Deletion

When an asset is deleted (e.g., when a user deletes a video or replaces a thumbnail):
1. The controller retrieves the old asset URL from the database.
2. The controller extracts the Cloudinary `publicId` from the URL.
3. The controller calls `deleteFromCloudinary(publicId)`.
4. Cloudinary destroys the asset and invalidates cache tags worldwide:
   ```javascript
   cloudinary.uploader.destroy(publicId, { invalidate: true })
   ```
5. The database record is then updated/deleted.
