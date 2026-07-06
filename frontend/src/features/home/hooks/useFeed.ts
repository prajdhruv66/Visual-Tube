import { useInfiniteQuery } from '@tanstack/react-query';
import { videoApi } from '@/services/api/videoApi';
import { normalizePaginated } from '@/utils/pagination';
import type { FeedMode } from '@/types/models';

export function useFeed(mode: FeedMode) {
  return useInfiniteQuery({
    queryKey: ['feed', mode],
    queryFn: async ({ pageParam }) => {
      const raw = await videoApi.getFeed(mode, { page: pageParam, limit: 16 });
      return normalizePaginated(raw);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
  });
}

export function usePersonalisedFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'personalised'],
    queryFn: async ({ pageParam }) => {
      const raw = await videoApi.getPersonalised({ page: pageParam, limit: 16 });
      return normalizePaginated(raw);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
  });
}
