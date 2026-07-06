import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { playlistApi, type CreatePlaylistPayload } from '@/services/api/playlistApi';

export function useUserPlaylists(userId: string | undefined) {
  return useQuery({
    queryKey: ['playlists', 'user', userId],
    queryFn: () => playlistApi.getForUser(userId as string),
    enabled: !!userId,
  });
}

export function usePlaylist(playlistId: string | undefined) {
  return useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => playlistApi.getById(playlistId as string),
    enabled: !!playlistId,
  });
}

export function useCreatePlaylist(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlaylistPayload) => playlistApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists', 'user', userId] }),
  });
}

export function useUpdatePlaylist(playlistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreatePlaylistPayload>) => playlistApi.update(playlistId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId: string) => playlistApi.remove(playlistId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists'] }),
  });
}

export function useAddVideoToPlaylist(playlistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => playlistApi.addVideo(playlistId, videoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }),
  });
}

export function useRemoveVideoFromPlaylist(playlistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => playlistApi.removeVideo(playlistId, videoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }),
  });
}
