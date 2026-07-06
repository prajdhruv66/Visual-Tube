# MongoDB Schema Documentation

This document describes the schema structure, data types, validation rules, and indexes of all collections stored in the MongoDB database for **Visual-Tube**.

---

## 1. `users` Collection
Stores user profiles, credentials, and user-specific watch tracking arrays.

| Field Name | Data Type | Key Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | **PK** | Required, Auto-generated | Unique identifier for the user. |
| `username` | `String` | Unique Index | Required, Unique, Lowercase, Trim | Unique user handle (e.g. `jane_doe`). |
| `email` | `String` | Unique Index | Required, Unique, Trim | User email address. |
| `fullname` | `String` | - | Required, Trim | User's display name (e.g. `Jane Doe`). |
| `avatar` | `String` | - | Required | Secure URL to the user's avatar image. |
| `coverImage` | `String` | - | Optional, Default: `""` | Secure URL to the user's cover banner image. |
| `watchHistory` | `Array<ObjectId>`| **FK** | Reference: `Video` | Array of references to recently watched videos. |
| `password` | `String` | - | Required | Encrypted bcrypt hash of the user password. |
| `refreshToken` | `String` | - | Optional | Saved JWT refresh token for session re-auth. |
| `createdAt` | `Date` | - | Auto-generated | Timestamp of registration. |
| `updatedAt` | `Date` | - | Auto-generated | Timestamp of last user modification. |

---

## 2. `videos` Collection
Stores uploaded videos, thumbnails, views counts, and publishing states.

| Field Name | Data Type | Key Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | **PK** | Required, Auto-generated | Unique identifier for the video. |
| `videoFile` | `String` | - | Required | Secure URL to the video file stored in cloud. |
| `thumbnail` | `String` | - | Required | Secure URL to the video cover thumbnail. |
| `title` | `String` | Text Index | Required | Title of the video. |
| `description`| `String` | Text Index | Required | Description details of the video. |
| `duration` | `Number` | - | Required | Length of the video in seconds. |
| `views` | `Number` | - | Default: `0` | Total number of views this video has received. |
| `isPublished`| `Boolean` | - | Default: `true` | Visibility toggle (Public = true, Private = false). |
| `owner` | `ObjectId` | **FK** | Required, Reference: `User` | Reference to the creator user ID. |
| `tags` | `Array<String>`| Text Index | Required, Lowercase, Trim | Tag keywords associated with search queries. |
| `createdAt` | `Date` | - | Auto-generated | Timestamp of video upload. |
| `updatedAt` | `Date` | - | Auto-generated | Timestamp of last video metadata update. |

---

## 3. `subscriptions` Collection
Stores channel subscription relationships between user accounts.

| Field Name | Data Type | Key Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | **PK** | Required, Auto-generated | Unique identifier for the relationship. |
| `subscriber` | `ObjectId` | **FK** | Required, Reference: `User` | User ID of the account subscribing to the channel. |
| `channel` | `ObjectId` | **FK** | Required, Reference: `User` | User ID of the channel creator being followed. |
| `createdAt` | `Date` | - | Auto-generated | Date of subscription. |
| `updatedAt` | `Date` | - | Auto-generated | Last modification timestamp. |

---

## 4. `comments` Collection
Stores textual comments written on videos.

| Field Name | Data Type | Key Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | **PK** | Required, Auto-generated | Unique identifier for the comment. |
| `content` | `String` | - | Required, Trim | Text content of the comment. |
| `video` | `ObjectId` | **FK** | Required, Reference: `Video` | Video ID of the video the comment belongs to. |
| `owner` | `ObjectId` | **FK** | Required, Reference: `User` | User ID of the author of the comment. |
| `createdAt` | `Date` | - | Auto-generated | Date of comment creation. |
| `updatedAt` | `Date` | - | Auto-generated | Date of last comment edit. |

---

## 5. `likes` Collection
Stores likes given to videos or comments. Utilizes Mongoose validate hooks to ensure a like belongs to exactly one video OR comment, never both.

| Field Name | Data Type | Key Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | **PK** | Required, Auto-generated | Unique identifier for the like. |
| `video` | `ObjectId` | **FK** | Optional, Reference: `Video` | Reference to the liked video. Null if comment liked. |
| `comment` | `ObjectId` | **FK** | Optional, Reference: `Comment` | Reference to the liked comment. Null if video liked. |
| `likedBy` | `ObjectId` | **FK** | Required, Reference: `User` | User ID of the account that liked the item. |
| `createdAt` | `Date` | - | Auto-generated | Date of like creation. |
| `updatedAt` | `Date` | - | Auto-generated | Last modification timestamp. |

---

## 6. `playlists` Collection
Stores curated lists of videos created by users.

| Field Name | Data Type | Key Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | **PK** | Required, Auto-generated | Unique identifier for the playlist. |
| `name` | `String` | - | Required, Trim | Name of the playlist (e.g. `Favorites`). |
| `description`| `String` | - | Optional, Trim | Description of the playlist. |
| `videos` | `Array<ObjectId>`| **FK** | Reference: `Video` | Array of references to the videos in this playlist. |
| `owner` | `ObjectId` | **FK** | Required, Reference: `User` | User ID of the owner of the playlist. |
| `createdAt` | `Date` | - | Auto-generated | Date of playlist creation. |
| `updatedAt` | `Date` | - | Auto-generated | Date of last playlist update. |
