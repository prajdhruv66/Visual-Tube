
# Visual-Tube Seed System Software Requirements Specification (SRS)

## 1. Purpose
Design a production-grade seed framework for Visual-Tube that creates a realistic, internally consistent video platform for development, testing, demos, and portfolio use.

## 2. Scope
The seed system shall:
- Reset MongoDB and Cloudinary seed assets.
- Generate correlated users, videos, playlists, comments, likes, subscriptions, and watch history.
- Use publicly available media.
- Produce recommendation-ready data.

## 3. Functional Requirements

### FR-1 Database Reset
- Delete collections in dependency order:
  Likes → Comments → Subscriptions → Playlists → Videos → Users.
- Abort on failure.

### FR-2 Cloudinary Reset
- Delete only assets under:
  visual-tube/seed/{avatars,covers,thumbnails,videos}
- Verify cleanup before continuing.

### FR-3 Users
- 50 creator accounts.
- 10 non-creator accounts.
- Each creator belongs to exactly one niche.

### FR-4 Creator Niches
Examples:
Programming, Backend, Frontend, DevOps, AI, Cyber Security,
Travel, Nature, Food, Science, Space, Gaming,
Movie Reviews, Business, Finance, Fitness, Lifestyle.

### FR-5 Videos
- ~20 videos per creator (~1000 total).
- Every video's title, description, tags, thumbnail, video, comments and playlist must describe the same topic.

### FR-6 Playlists
- 3–4 playlists per creator.
- Playlist contains only niche-related videos.

### FR-7 Topic Manifest
Generation pipeline:
Category → Topic → Metadata → Media Search → Validation → Cloudinary → MongoDB.

Each topic stores:
title, description, tags, thumbnail keywords,
video keywords, playlist name, comment templates,
difficulty, related topics.

### FR-8 Media Sources
Prefer sources without API keys.

| Niche | Preferred Sources |
|-------|-------------------|
| Programming/Backend | Mixkit, Videvo (developer B-roll) |
| AI/Technology | Videvo, Mixkit |
| Travel | Wikimedia Commons, Mixkit, Internet Archive |
| Nature | Wikimedia Commons, Videvo |
| Food | Mixkit, Openverse |
| Science/Space | Wikimedia Commons, Internet Archive |
| History/News | Internet Archive |
| Fitness/Business/Lifestyle | Mixkit |

API-key sources (Pexels, Pixabay, NASA, Smithsonian, Flickr) are fallback only.

### FR-9 Programming Rule
Use developer B-roll (coding, terminals, offices, server rooms).
Metadata remains topic-specific (MongoDB, Redis, Docker, etc.).

### FR-10 Batch Processing
Process 3 creators at a time:
1. Download temporary media.
2. Validate.
3. Upload to Cloudinary.
4. Create MongoDB documents.
5. Delete temporary files.
6. Continue with next batch.

Never retain the full media library locally.

### FR-11 Social Graph
Generate:
- subscriptions
- likes
- comments
- watch history
- recommendations

Interactions should favor similar niches.

### FR-12 Views
Initial views should be intentionally low (e.g. 20–500) so real user interactions visibly change counts.

## 4. Non-functional Requirements
- Modular architecture.
- Retry failed downloads.
- Structured logging.
- Referential integrity validation.
- Rollback on critical failures.
- No orphaned Cloudinary assets or MongoDB references.

## 5. Folder Structure
backend/scripts/
- seed.js
- config/
- content/
- cleanup/
- downloads/
- services/
- utils/
- logs/
- temp/
- README.md

## 6. Acceptance Criteria
- Fresh MongoDB every run.
- Fresh Cloudinary seed assets every run.
- ~60 users (50 creators + 10 viewers).
- ~1000 videos.
- 3–4 playlists per creator.
- Consistent metadata/media.
- Recommendations appear realistic.
- Search results align with niches.
- No local media accumulation after completion.

## 7. Deliverables
- Complete implementation under backend/scripts.
- README.
- package.json seed script.
- Downloadable ZIP containing the complete implementation.
