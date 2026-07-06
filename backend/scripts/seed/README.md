# Visual-Tube Database Seed Framework (SRS Compliant)

This directory contains the production-grade database seeding framework for the Visual-Tube application, designed to meet the specifications listed in `Visual-Tube-Seed-System-SRS.md`.

---

## Architecture Design

The seeding process is fully modularized and structured as follows:

```
backend/scripts/seed/
├── seed.js                   # Seeding process coordinator (FR-10 Batch Pipeline)
├── README.md                 # System manual
├── cleanup/
│   └── index.js              # Database and Cloudinary reset routines (FR-1, FR-2)
├── config/
│   └── index.js              # Configurations, batch limits, paths (FR-3, FR-12)
├── content/
│   └── manifest.js           # Categories, creators, topics and viewer profiles (FR-4, FR-7)
├── download/
│   └── index.js              # Media fetchers utilizing public, keyless APIs (FR-8, FR-9)
├── services/
│   ├── cloudinary.js         # Cloudinary customized upload pathways & rollbacks
│   └── validation.js         # Integrity checkpoints (NFR checks)
└── utils/
    └── index.js              # Formatting, random numbers, and logger helpers
```

### Key Functional Implementations

1. **Database Reset (FR-1)**: Wipes collection models in correct dependency order:
   $$\text{Likes} \longrightarrow \text{Comments} \longrightarrow \text{Subscriptions} \longrightarrow \text{Playlists} \longrightarrow \text{Videos} \longrightarrow \text{Users}$$
2. **Cloudinary Purge (FR-2)**: Purges files under `visual-tube/seed/` recursively and verifies cleanup.
3. **Viewer & Creator Generation (FR-3, FR-4)**: Generates 50 creators distributed across 17 niches and 10 non-creator viewer accounts.
4. **Batch Seeding Pipeline (FR-10)**: Downloads, validates, uploads, and seeds records in batches of **3 creators** at a time, wiping temp assets from `.seed-workspace/temp/` at the end of each batch. This prevents local storage overflow.
5. **Correlated Media Downloads (FR-8, FR-9)**: Searches Wikimedia Commons and Internet Archive APIs without any keys. Uses developer B-roll for coding content, but maps it to highly technical, topic-specific metadata.
6. **Social Graph Integrity (FR-11)**: Interlinks comments, likes, subscriptions, and histories favoring similar categories to build realistic recommendation feeds.
7. **Intentionally Low View Counts (FR-12)**: Starts views between 20 and 500 to make real user testing visible.

---

## Configuration & Run Guide

You can run the script directly from your package manager:

```bash
# Clear database, download assets, and seed database
npm run seed -- --clear
```

All downloaded assets and reports are managed inside the project root's `.seed-workspace/` folder:
- `.seed-workspace/temp/`: Batch media downloads.
- `.seed-workspace/logs/`: Detailed logging.
- `.seed-workspace/reports/`: Markdown report generated on successful seeding.
