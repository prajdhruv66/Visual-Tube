import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type UpdateAccountPayload } from '@/services/api/userApi';
import type { UploadProgressHandler } from '@/services/api/apiClient';

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAccountPayload) => userApi.updateAccount(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useUpdateAvatar() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: UploadProgressHandler }) =>
      userApi.updateAvatar(file, onProgress),
  });
}

export function useUpdateCoverImage() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: UploadProgressHandler }) =>
      userApi.updateCoverImage(file, onProgress),
  });
}
