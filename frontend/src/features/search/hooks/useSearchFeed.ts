import { useInfiniteQuery } from '@tanstack/react-query';
import { videoApi } from '@/services/api/videoApi';
import { normalizePaginated } from '@/utils/pagination';

export function useSearchFeed(query: string) {
  return useInfiniteQuery({
    queryKey: ['feed', 'search', query],
    queryFn: async ({ pageParam }) => {
      const raw = await videoApi.search(query, { page: pageParam, limit: 16 });
      return normalizePaginated(raw);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    enabled: query.trim().length > 0,
  });
}
