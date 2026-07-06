import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi, type UploadVideoPayload } from '@/services/api/videoApi';
import type { UploadProgressHandler } from '@/services/api/apiClient';

export function useUploadVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, onProgress }: { payload: UploadVideoPayload; onProgress?: UploadProgressHandler }) =>
      videoApi.upload(payload, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
