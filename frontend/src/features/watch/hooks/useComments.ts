import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '@/services/api/commentApi';
import { likeApi } from '@/services/api/likeApi';
import { normalizePaginated } from '@/utils/pagination';

export function useComments(videoId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', videoId],
    queryFn: async ({ pageParam }) => {
      const raw = await commentApi.getForVideo(videoId, pageParam, 20);
      return normalizePaginated(raw);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    enabled: !!videoId,
  });
}

export function useAddComment(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => commentApi.add(videoId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', videoId] }),
  });
}

export function useEditComment(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentApi.edit(commentId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', videoId] }),
  });
}

export function useDeleteComment(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentApi.remove(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', videoId] }),
  });
}

export function useCommentLike(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => likeApi.toggleCommentLike(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', videoId] }),
  });
}
