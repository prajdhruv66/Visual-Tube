import { useQuery, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '@/services/api/videoApi';

export function useVideo(videoId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videoApi.getById(videoId as string),
    enabled: !!videoId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['video', videoId] });

  return { ...query, invalidate };
}
