import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likeApi } from '@/services/api/likeApi';
import type { Video } from '@/types/models';

export function useVideoLike(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => likeApi.toggleVideoLike(videoId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['video', videoId] });
      const previous = queryClient.getQueryData<Video>(['video', videoId]);
      if (previous) {
        queryClient.setQueryData<Video>(['video', videoId], {
          ...previous,
          isLiked: !previous.isLiked,
          likesCount: (previous.likesCount ?? 0) + (previous.isLiked ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['video', videoId], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['video', videoId] }),
  });
}
