import { apiClient, unwrap, withUploadProgress, type UploadProgressHandler } from './apiClient';
import type { Video } from '@/types/models';
import type { RawPaginated } from '@/types/api';
import { parseTags } from '@/utils/tags';

export interface UploadVideoPayload {
  video: File;
  thumbnail: File;
  title: string;
  description: string;
  tags: string; // raw comma-separated input from the form; converted to string[] before sending
  isPublished: boolean;
}

export interface UpdateVideoPayload {
  title?: string;
  description?: string;
  tags?: string; // raw comma-separated input from the form; converted to string[] before sending
}

export interface FeedParams {
  page?: number;
  limit?: number;
  search?: string;
  /**
   * ASSUMPTION: the collection only documents `mode=trending`, `mode=newest`
   * and `search=`. There is no dedicated "videos by channel" endpoint, so the
   * Channel page reuses get-feed with a `channelId` filter. If the backend
   * does not support this param yet, add a matching filter there.
   * `useChannelVideos` additionally filters client-side by owner as a
   * safety net in case the backend ignores this param.
   */
  channelId?: string;
}

export const videoApi = {
  upload: (payload: UploadVideoPayload, onProgress?: UploadProgressHandler) => {
    const form = new FormData();
    form.append('video', payload.video);
    form.append('thumbnail', payload.thumbnail);
    form.append('title', payload.title);
    form.append('description', payload.description);
    // Sent as a real string[]: one 'tags' field per tag (standard multipart array encoding).
    parseTags(payload.tags).forEach((tag) => form.append('tags', tag));
    form.append('isPublished', String(payload.isPublished));
    return unwrap<Video>(
      apiClient.post('/videos/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300_000, // 5 minutes timeout for video upload
        ...withUploadProgress(onProgress),
      })
    );
  },

  getById: (videoId: string) => unwrap<Video>(apiClient.get(`/videos/${videoId}`)),

  /**
   * Registers a watch. Per backend contract, this must only be called
   * client-side ~15-20s after playback actually begins — NOT on page load.
   * See `useRegisterWatch` in the watch feature for the timing logic.
   */
  registerWatch: (videoId: string) => unwrap<null>(apiClient.post(`/videos/${videoId}/watch`)),

  updateThumbnail: (videoId: string, thumbnail: File, onProgress?: UploadProgressHandler) => {
    const form = new FormData();
    form.append('thumbnail', thumbnail);
    return unwrap<Video>(
      apiClient.patch(`/videos/${videoId}/thumbnail`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000, // 2 minutes timeout for thumbnail update
        ...withUploadProgress(onProgress),
      })
    );
  },

  updateDetails: (videoId: string, payload: UpdateVideoPayload) =>
    unwrap<Video>(
      apiClient.patch(`/videos/${videoId}`, {
        ...payload,
        tags: payload.tags !== undefined ? parseTags(payload.tags) : undefined,
      })
    ),

  togglePublish: (videoId: string, isPublished: boolean) =>
    unwrap<Video>(apiClient.patch(`/videos/${videoId}/publish`, { isPublished })),

  delete: (videoId: string) => unwrap<null>(apiClient.delete(`/videos/${videoId}`)),

  getFeed: (mode: 'trending' | 'newest', params: FeedParams = {}) =>
    unwrap<RawPaginated<Video> | Video[]>(
      apiClient.get('/videos/get-feed', { params: { mode, ...params } })
    ),

  search: (search: string, params: FeedParams = {}) =>
    unwrap<RawPaginated<Video> | Video[]>(apiClient.get('/videos/get-feed', { params: { search, ...params } })),

  getPersonalised: (params: FeedParams = {}) =>
    unwrap<RawPaginated<Video> | Video[]>(
      apiClient.get('/videos/personalised', { params: { page: 1, limit: 20, ...params } })
    ),

  getLikes: (videoId: string) => unwrap<{ likesCount: number; isLiked: boolean }>(apiClient.get(`/videos/${videoId}/likes`)),
};
