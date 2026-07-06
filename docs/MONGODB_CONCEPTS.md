# MongoDB Database Concepts Usage

This document explains the advanced MongoDB and Mongoose database design patterns and queries utilized throughout the Visual-Tube application to achieve high-performance text searches, unique relational constraints, and aggregation-level pagination.

---

## 1. Pagination via `$facet` (Aggregation-Level)

To load data efficiently in the frontend's infinite scroll, the backend uses the `$facet` operator to divide the aggregation pipeline into multiple streams inside a single query:
1. **Metadata stream**: Counts the total matched documents in the collection:
   ```javascript
   { $count: "totalVideos" }
   ```
2. **Data stream**: Slices the matches based on current page index and page limits using:
   ```javascript
   { $skip: (page - 1) * limit },
   { $limit: limit }
   ```

This avoids executing two separate database calls (one count query and one query to fetch files) which reduces database connection overhead and network lag.

---

## 2. Text Compound Search Indexes (`video_text_search`)

To support keyword matching (on the main search bar), the `videos` collection defines a compound **Text Index** on the `title`, `description`, and `tags` fields:
```javascript
videoSchema.index(
    {
        title: "text",
        description: "text",
        tags: "text"
    },
    {
        weights: {
            title: 10,       // Matches in titles are given highest weight
            tags: 5,         // Matches in tags are medium importance
            description: 2   // Matches in description are lowest importance
        },
        name: "video_text_search"
    }
);
```

When search queries are made via `$text: { $search: search }`, MongoDB calculates a relevance score for each match. The feed sorts the results using the relevance score:
```javascript
$sort: { score: { $meta: "textScore" } }
```

---

## 3. Compound Unique Index constraints

### Subscriptions Uniqueness
A subscriber should not be able to subscribe to the same channel multiple times. To enforce this database-level constraint, a compound index on `{ subscriber: 1, channel: 1 }` is defined with a unique constraint:
```javascript
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });
```
Any subsequent attempt to create a subscription document between the same two users will throw a duplicate key error (code `11000`), protecting data integrity.

---

## 4. Partial Filter Unique Indexes (Likes Uniqueness)

The `likes` collection allows users to like either a **video** or a **comment**, but a user can like a specific item only once. 

Because `video` and `comment` fields are nullable (e.g. video likes have `comment: null`, comment likes have `video: null`), a standard unique index on `{ likedBy: 1, video: 1 }` would block all comment likes after the first one because they would all have `video: null` (violating uniqueness).

To solve this, **Partial Filter Expressions** are used to apply the unique index constraint ONLY when the fields are non-null:

### Video Likes Unique Constraint:
Enforces that a user can like a specific video only once. Applied only when `video` exists (is not null/undefined):
```javascript
likeSchema.index(
    { likedBy: 1, video: 1 },
    {
        unique: true,
        partialFilterExpression: { video: { $exists: true } }
    }
);
```

### Comment Likes Unique Constraint:
Enforces that a user can like a specific comment only once. Applied only when `comment` exists:
```javascript
likeSchema.index(
    { likedBy: 1, comment: 1 },
    {
        unique: true,
        partialFilterExpression: { comment: { $exists: true } }
    }
);
```
These partial indexes guarantee perfect unique constraints on polymorphic relations without crashing other data paths.
