import { useInfiniteQuery } from '@tanstack/react-query';
import { videoApi } from '@/services/api/videoApi';
import { normalizePaginated } from '@/utils/pagination';

/** See ASSUMPTION note in videoApi.getFeed re: channelId filter. */
export function useChannelVideos(channelId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['channel-videos', channelId],
    queryFn: async ({ pageParam }) => {
      const raw = await videoApi.getFeed('newest', { page: pageParam, limit: 16, channelId });
      const normalized = normalizePaginated(raw);
      // Safety net: if the backend doesn't actually support the channelId
      // filter yet, don't show other channels' videos on this page.
      const filtered = normalized.items.filter((video) => {
        const ownerId = typeof video.owner === 'string' ? video.owner : video.owner._id;
        return !channelId || ownerId === channelId;
      });
      return { ...normalized, items: filtered };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    enabled: !!channelId,
  });
}
