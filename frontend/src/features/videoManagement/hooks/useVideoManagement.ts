import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi, type UpdateVideoPayload } from '@/services/api/videoApi';
import type { UploadProgressHandler } from '@/services/api/apiClient';

export function useUpdateVideoDetails(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVideoPayload) => videoApi.updateDetails(videoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['channel-videos'] });
    },
  });
}

export function useUpdateThumbnail(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: UploadProgressHandler }) =>
      videoApi.updateThumbnail(videoId, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['channel-videos'] });
    },
  });
}

export function useTogglePublish(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isPublished: boolean) => videoApi.togglePublish(videoId, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['channel-videos'] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => videoApi.delete(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-videos'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
