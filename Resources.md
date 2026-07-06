# Resources.md

# Visual-Tube Seed System Resource Mapping

## General Rules
- Prefer sources without API keys.
- Use API sources only as fallback.
- Download temporarily, upload to Cloudinary, then delete local files.
- Validate every asset.

## Resource Priority
1. Wikimedia Commons
2. Internet Archive
3. Mixkit
4. Videvo
5. Openverse (images)

Fallback:
- Pexels
- Pixabay
- NASA
- Smithsonian
- Flickr

## Niche Mapping

| Niche | Search Keywords | Preferred Sources |
|---|---|---|
| Programming / Backend / Frontend | developer coding, VS Code, backend terminal, software engineer | Mixkit → Videvo |
| MongoDB | database developer, backend coding | Mixkit → Videvo |
| Node.js | JavaScript developer, terminal | Mixkit |
| Express | backend developer | Mixkit |
| Redis | backend engineer, cloud server | Videvo |
| Docker | DevOps, server racks | Videvo |
| AI | artificial intelligence, ML engineer | Videvo → Mixkit |
| Cyber Security | cybersecurity analyst, firewall | Videvo → Mixkit |
| Science | laboratory, chemistry, biology | Wikimedia Commons → Internet Archive |
| Space | galaxy, telescope, ISS | Wikimedia Commons → NASA (optional) → Internet Archive |
| Travel | Goa, Kerala, Ladakh, Paris | Wikimedia Commons → Mixkit → Internet Archive |
| Nature | forest, waterfalls, mountains | Wikimedia Commons → Videvo |
| Wildlife | tiger, elephant, birds | Wikimedia Commons → Videvo |
| Food Blogging | street food, cooking | Mixkit → Openverse |
| Fitness | gym, workout | Mixkit → Videvo |
| Business | startup, office | Mixkit |
| Finance | stock market | Mixkit → Videvo |
| Photography | camera, landscape | Wikimedia Commons → Openverse |
| Gaming | gaming setup, esports | Videvo → Mixkit |
| Movie Reviews | cinema, reviewer desk (no copyrighted clips) | Mixkit → Videvo |
| History | museum, monuments | Internet Archive → Wikimedia Commons |
| News | newsroom, reporter | Internet Archive → Videvo |
| Sports | cricket, football | Videvo → Wikimedia Commons |
| Lifestyle | home office, coffee shop | Mixkit |
| Automobiles | sports car, highway | Mixkit → Videvo |

## Programming Rule
Use developer B-roll for programming topics while keeping title, description, tags and comments topic-specific.

## Thumbnail Strategy
1. Download video.
2. Extract 3–5 frames with FFmpeg.
3. Pick the sharpest frame.
4. Upload it as thumbnail.

## Media Pipeline
Topic → Visual Intent → Search Keywords → Preferred Source → Download → Validate → Upload to Cloudinary → Extract Thumbnail → Store MongoDB URLs → Delete Temporary Files.

Never allow unrelated title, description, tags, thumbnail and video.
