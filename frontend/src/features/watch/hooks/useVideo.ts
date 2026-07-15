import { useQuery, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '@/services/api/videoApi';
import type { Video } from '@/types/models';

export function useVideo(videoId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videoApi.getById(videoId as string),
    enabled: !!videoId,
    refetchInterval: (query) => {
      const video = query.state.data as Video | undefined;
      if (
        video &&
        video.processingStatus &&
        video.processingStatus !== 'published' &&
        video.processingStatus !== 'failed'
      ) {
        return 3000; // poll every 3s while processing or queued
      }
      return false;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['video', videoId] });

  return { ...query, invalidate };
}
