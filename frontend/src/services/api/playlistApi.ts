import { apiClient, unwrap } from './apiClient';
import type { Playlist } from '@/types/models';

export interface CreatePlaylistPayload {
  name: string;
  description: string;
}

export const playlistApi = {
  create: (payload: CreatePlaylistPayload) => unwrap<Playlist>(apiClient.post('/playlist/', payload)),

  getForUser: (userId: string) => unwrap<Playlist[]>(apiClient.get(`/playlist/user/${userId}`)),

  getById: (playlistId: string) => unwrap<Playlist>(apiClient.get(`/playlist/${playlistId}`)),

  update: (playlistId: string, payload: Partial<CreatePlaylistPayload>) =>
    unwrap<Playlist>(apiClient.patch(`/playlist/${playlistId}`, payload)),

  remove: (playlistId: string) => unwrap<null>(apiClient.delete(`/playlist/${playlistId}`)),

  addVideo: (playlistId: string, videoId: string) =>
    unwrap<Playlist>(apiClient.post(`/playlist/${playlistId}/video/${videoId}`)),

  removeVideo: (playlistId: string, videoId: string) =>
    unwrap<Playlist>(apiClient.delete(`/playlist/${playlistId}/video/${videoId}`)),
};
