# Database entity Relationship (ER) Diagram

This document describes the Entity-Relationship (ER) design of the **Visual-Tube** database schema, matching the structure shown in the [Visual-Tube ER Diagram](file:///c:/Users/admin/Desktop/Capstone_project/Visual-Tube%20ER%20Diagram.png).

---

## 1. Diagram Legend & Annotations

* **PK (Primary Key)**: Unique identifier for a document (MongoDB Atlas generates `_id` as an `ObjectId` automatically).
* **FK (Foreign Key)**: Reference to another collection's `_id` field.
* **1 (One side)** / **N (Many side)**: Indicates the multiplicity of the relationship (e.g. One user can have many videos).
* **FK Array**: A field storing an array of references to other documents (e.g., playlists containing a list of video IDs).
* **Nullable FK**: A foreign key reference that can be omitted or set to null/undefined depending on document type (e.g., likes can have comment null or video null).

---

## 2. Collections & Entity Properties

The database consists of 6 primary collections:
1. **`users` (User Account Profiles)**
   * PK: `_id` (ObjectId)
   * Unique: `username`, `email`
   * Attributes: `fullname`, `avatar`, `coverImage`, `password`, `refreshToken`
   * Array FK: `watchHistory` (references multiple `videos._id` values)
2. **`videos` (Uploaded Content)**
   * PK: `_id` (ObjectId)
   * FK: `owner` (references `users._id` - belongs to 1 user)
   * Attributes: `videoFile`, `thumbnail`, `title`, `description`, `duration`, `views`, `isPublished`, `tags`
3. **`comments` (Video Feedback)**
   * PK: `_id` (ObjectId)
   * FK: `video` (references `videos._id` - belongs to 1 video)
   * FK: `owner` (references `users._id` - belongs to 1 user author)
   * Attributes: `content`
4. **`subscriptions` (Channel Followers)**
   * PK: `_id` (ObjectId)
   * FK: `subscriber` (references `users._id` - user subscribing to channel)
   * FK: `channel` (references `users._id` - target channel being subscribed to)
5. **`likes` (Likes Tracker)**
   * PK: `_id` (ObjectId)
   * FK: `likedBy` (references `users._id` - user who gave the like)
   * Nullable FK: `video` (references `videos._id` - if liked a video)
   * Nullable FK: `comment` (references `comments._id` - if liked a comment)
6. **`playlists` (User Curated Playlists)**
   * PK: `_id` (ObjectId)
   * FK: `owner` (references `users._id` - playlist creator)
   * Array FK: `videos` (references multiple `videos._id` values)
   * Attributes: `name`, `description`

---

## 3. Relationships & Multiplicity Rules

```
       +-------+  1      has      N  +--------+
       | users | ------------------> | videos |
       +-------+                     +--------+
         |   |                         |    |
       1 |   | 1                       | 1  | 1
         |   |                         |    |
         v   v                         v    v
       N |   | N                     N |    | N
+---------+ +---------------+ +----------+ +-------+
| playlist| | subscriptions | | comments | | likes |
+---------+ +---------------+ +----------+ +-------+
```

### 3.1 User to Video (One-to-Many)
* **Rule**: One user can upload multiple videos (`1 -> N`). A video must belong to exactly one creator owner.
* **Relationship**: `users._id` $\rightarrow$ `videos.owner` (FK).

### 3.2 User to Subscription (One-to-Many / Self-Referential)
* **Rule**: A subscriber can follow multiple channels, and a channel can have multiple subscribers.
* **Subscriber Relationship**: `users._id` $\rightarrow$ `subscriptions.subscriber` (FK).
* **Channel Relationship**: `users._id` $\rightarrow$ `subscriptions.channel` (FK).
* **Constraint**: Composite unique index on `{ subscriber: 1, channel: 1 }` prevents duplicates.

### 3.3 Video to Comment (One-to-Many)
* **Rule**: A video can have multiple comments. A comment must belong to exactly one video.
* **Relationship**: `videos._id` $\rightarrow$ `comments.video` (FK).

### 3.4 User to Comment (One-to-Many)
* **Rule**: A user can write multiple comments. A comment must belong to exactly one user author.
* **Relationship**: `users._id` $\rightarrow$ `comments.owner` (FK).

### 3.5 User and Video/Comment to Like (One-to-Many / Polymorphic)
* **Rule**: A user can like multiple items. An item (video/comment) can be liked by multiple users.
* **Liker Relationship**: `users._id` $\rightarrow$ `likes.likedBy` (FK).
* **Target Relationship**: `likes.video` (FK) or `likes.comment` (FK).
* **Constraints**: Partial unique filter indexes ensure a user can only like a specific video/comment once.

### 3.6 User to Playlist (One-to-Many)
* **Rule**: A user can create multiple playlists. A playlist belongs to exactly one owner.
* **Owner Relationship**: `users._id` $\rightarrow$ `playlists.owner` (FK).
* **Contents Relationship**: Playlists store an array of video IDs: `playlists.videos` $\rightarrow$ `Array<videos._id>` (FK Array).
