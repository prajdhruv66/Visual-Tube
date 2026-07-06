# Frontend Architecture Documentation

Visual-Tube's frontend client is built as a React 19 Single Page Application (SPA) using TypeScript, Vite, and Tailwind CSS. The folder structure follows a **Feature-First Architecture** combined with shared layout layouts.

---

## 1. Directory Structure

The core files are located under `frontend/src`:

```
src/
├── components/          # Shared global UI and layout components
│   ├── layout/          # Sidebar, Header, layouts
│   ├── media/           # VideoCard, VideoGrid feeds
│   ├── feedback/        # EmptyState, ErrorState, Skeletons
│   └── ui/              # Avatar, Button, Spinner, Badge, Modal
├── context/             # React Context providers (AuthContext)
├── features/            # Feature modules (Hooks, Pages, Components)
│   ├── auth/            # Registration, Login
│   ├── home/            # Feeds, Recommendation lists
│   ├── watch/           # Playback, related videos, comment section
│   ├── channel/         # Profiles, channel feeds
│   ├── upload/          # Video creation form
│   ├── playlists/       # Playlist management
│   ├── history/         # Watch history
│   └── subscriptions/   # Subscriber feeds
├── routes/              # Client-side router configuration (AppRoutes.tsx)
├── schemas/             # Client-side form validation schemas (Zod)
├── services/            # Axios API client integrations
└── utils/               # Formatting helpers, pagination normalizers
```

---

## 2. Feature-First Organization

Each directory inside `src/features/` is self-contained:
1. **`hooks/`**: Houses TanStack React Query custom hooks (`useQuery` / `useMutation`) that handle caching and API calls.
2. **`pages/`**: View entry points loaded by React Router.
3. **`components/`**: Private components used only by this feature.

### E.g., The `playlists` Feature Directory:
* `features/playlists/pages/MyPlaylistsPage.tsx`: Grid list of user playlists.
* `features/playlists/pages/PlaylistDetailsPage.tsx`: Detail list of videos inside a playlist.
* `features/playlists/components/CreatePlaylistModal.tsx`: Form modal to create playlists.
* `features/playlists/hooks/usePlaylists.ts`: Custom query hooks for fetching/mutating playlists.

---

## 3. Custom Hooks & Query Caching (TanStack React Query)

Visual-Tube relies on React Query to separate network calls from UI rendering. Query results are cached and automatically updated in the background.

* **Infinite Queries (`useInfiniteQuery`)**:
  Used on feeds, search grids, and comment lists to handle infinite-scroll loading. The page size defaults to 16/20 items.
  ```typescript
  export function useFeed(mode: FeedMode) {
    return useInfiniteQuery({
      queryKey: ['feed', mode],
      queryFn: async ({ pageParam }) => {
        const raw = await videoApi.getFeed(mode, { page: pageParam, limit: 16 });
        return normalizePaginated(raw); // Normalizes different paginated shapes
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    });
  }
  ```
* **Cache Invalidation (`useMutation`)**:
  When a mutation (like adding a comment or liking a video) succeeds, it automatically invalidates cache query keys to trigger background updates without requiring a page reload:
  ```typescript
  export function useAddComment(videoId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (content: string) => commentApi.add(videoId, content),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', videoId] }),
    });
  }
  ```

---

## 4. API Services & Axios Client

* **Base client (`services/api/apiClient.ts`)**:
  Instantiates an Axios client with `withCredentials: true` to automatically forward authentication JWT cookies in headers. Includes interceptors to extract API errors.
* **Service Classes (`services/api/`)**:
  * `userApi.ts`: Profile management, logins, channel searches.
  * `videoApi.ts`: Uploading, updating details, feeds fetches, likes count.
  * `subscriptionApi.ts`: Subscribed creators list, subscriber toggles.
  * `commentApi.ts`: Fetching comment threads, posting, editing, deleting.
  * `playlistApi.ts`: Creation, updates, deletions, and adding/removing videos.
