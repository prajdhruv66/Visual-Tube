import { apiClient, unwrap } from './apiClient';

export const likeApi = {
  toggleVideoLike: (videoId: string) => unwrap<{ liked: boolean }>(apiClient.post(`/like/video/${videoId}`)),
  toggleCommentLike: (commentId: string) =>
    unwrap<{ liked: boolean }>(apiClient.post(`/like/comment/${commentId}`)),
};
