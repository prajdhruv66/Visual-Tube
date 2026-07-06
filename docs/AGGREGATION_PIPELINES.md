# MongoDB Aggregation Pipelines

Visual-Tube utilizes complex MongoDB aggregation pipelines (`db.collection.aggregate()`) to execute high-performance queries, join related documents (such as user metadata onto video feeds), count sub-documents, and handle pagination in a single database round-trip.

---

## 1. Video Feed Pipeline (`getAllVideoPipeline`)
* **Location**: `backend/src/pipelines/getAllVideo.pipeline.js`
* **Purpose**: Generates search feeds, trending grids, and channel-specific video lists.

### Pipeline Stages

```
1. Match (isPublished + search / channelId filters)
       ▼
2. Lookup Users (owner profile details)
       ▼
3. Lookup Subscriptions (compute subscribers count inside users lookup)
       ▼
4. Project User (username, avatar, fullname, subscribersCount)
       ▼
5. Unwind User (convert owner array to flat object)
       ▼
6. Lookup Likes (count likes for each video)
       ▼
7. Project Video (rename likeCount to likesCount, project details)
       ▼
8. Sort (by textScore match, views count, or createdAt date)
       ▼
9. Facet (Pagination: skip & limit, count total matches)
```

1. **`$match`**: Filters documents. If a `channelId` is provided, it returns all videos belonging to that channel (allowing creators to see their unpublished videos while restricting guest views to `isPublished: true`). If a search query is provided, it uses the `$text` search index.
2. **`$lookup` (users)**: Joins the `users` collection. A sub-pipeline runs inside to perform a `$lookup` on the `subscriptions` collection where the channel field matches the user's `_id`. It adds a field `subscribersCount` using `{ $size: "$subscribers" }` and projects only public profile properties.
3. **`$unwind`**: Flattens the array created by `$lookup` into a single `owner` object.
4. **`$lookup` (likes)**: Joins the `likes` collection to retrieve all likes matching the video ID.
5. **`$addFields`**: Calculates `likesCount` using `{ $size: "$videoLikes" }`.
6. **`$sort`**: Sorts the list based on search scores (`score: { $meta: "textScore" }`), view counts (`views: -1`), or upload date (`createdAt: -1`).
7. **`$facet`**: Executes two independent sub-pipelines simultaneously:
   * `metadata`: Counts total matched documents via `{ $count: "totalVideos" }`.
   * `videos`: Applies pagination via `{ $skip: (page - 1) * limit }` and `{ $limit: limit }`.

---

## 2. Personalized Recommendations Pipeline (`recommendedPipeline`)
* **Location**: `backend/src/pipelines/personlised.pipeline.js`
* **Purpose**: Generates personalized video recommendations for the home screen based on the user's recent watch history and matching tags.

### Pipeline Stages
1. **`$match`**: Finds published videos that have tags intersecting with the user's watched video tags (`tags: { $in: extractedTags }`) and excludes videos the user has already watched (`_id: { $nin: watchedVideoIds }`).
2. **`$lookup` (users)**: Populates the owner's channel details (username, avatar, fullname, and calculated subscribers count).
3. **`$unwind`**: Flattens the owner array into an object.
4. **`$lookup` (likes)**: Joins likes and calculates `likesCount`.
5. **`$project`**: Reshapes the output document structure.
6. **`$sort`**: Orders recommendations by views count and upload date to display high-quality trending matching content first (`{ views: -1, createdAt: -1 }`).
7. **`$facet`**: Paginate results into `metadata` (totalVideos count) and `videos` list.

---

## 3. Channel Profile Pipeline (`getUserChannelProfile`)
* **Location**: `backend/src/controllers/user.controller.js`
* **Purpose**: Gathers a channel's statistics and checks if the logged-in viewer is currently subscribed.

### Pipeline Stages
1. **`$match`**: Filters by `username` case-insensitively.
2. **`$lookup` (subscribers)**: Joins the `subscriptions` collection where the user ID matches `channel`.
3. **`$lookup` (subscribedTo)**: Joins the `subscriptions` collection where the user ID matches `subscriber` (to count how many channels this user follows).
4. **`$addFields`**:
   * `subscriberCount`: Size of the `subscribers` array.
   * `channelsSubscribedToCount`: Size of the `subscribedTo` array.
   * `isSubscribed`: Evaluates whether the currently logged-in user's ID exists inside the `subscribers` array (i.e. `{ $in: [req.user?._id, "$subscribers.subscriber"] }`).
5. **`$project`**: Excludes private passwords/tokens and projects `subscribersCount` and `isSubscribed` to the client.
