import { apiClient, unwrap } from './apiClient';
import type { Comment } from '@/types/models';
import type { RawPaginated } from '@/types/api';

export const commentApi = {
  getForVideo: (videoId: string, page = 1, limit = 20) =>
    unwrap<RawPaginated<Comment> | Comment[]>(
      apiClient.get(`/comments/video/${videoId}`, { params: { page, limit } })
    ),

  add: (videoId: string, content: string) =>
    unwrap<Comment>(apiClient.post(`/comments/video/${videoId}`, { content })),

  edit: (commentId: string, content: string) =>
    unwrap<Comment>(apiClient.patch(`/comments/${commentId}`, { content })),

  remove: (commentId: string) => unwrap<null>(apiClient.delete(`/comments/${commentId}`)),
};
