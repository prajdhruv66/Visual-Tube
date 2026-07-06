import { apiClient, unwrap, withUploadProgress, type UploadProgressHandler } from './apiClient';
import type { ChannelProfile, LoginResponse, User, Video } from '@/types/models';
import type { RawPaginated } from '@/types/api';

export interface RegisterPayload {
  fullname: string;
  username: string;
  email: string;
  password: string;
  avatar: File;
  coverImage?: File;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface UpdateAccountPayload {
  fullname?: string;
  email?: string;
}

function buildRegisterFormData(payload: RegisterPayload) {
  const form = new FormData();
  form.append('fullname', payload.fullname);
  form.append('username', payload.username);
  form.append('email', payload.email);
  form.append('password', payload.password);
  form.append('avatar', payload.avatar);
  if (payload.coverImage) form.append('coverImage', payload.coverImage);
  return form;
}

export const userApi = {
  register: (payload: RegisterPayload, onProgress?: UploadProgressHandler) =>
    unwrap<User>(
      apiClient.post('/user/register', buildRegisterFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...withUploadProgress(onProgress),
      })
    ),

  login: (payload: LoginPayload) => unwrap<LoginResponse>(apiClient.post('/user/login', payload)),

  logout: () => unwrap<null>(apiClient.post('/user/logout')),

  regenerateTokens: (refreshToken?: string) =>
    unwrap<{ accessToken: string; refreshToken: string }>(
      apiClient.post('/user/regenerate-tokens', refreshToken ? { refreshToken } : {})
    ),

  getMe: () => unwrap<User>(apiClient.get('/user/me')),

  updateAccount: (payload: UpdateAccountPayload) => unwrap<User>(apiClient.patch('/user/me', payload)),

  updateAvatar: (avatar: File, onProgress?: UploadProgressHandler) => {
    const form = new FormData();
    form.append('avatar', avatar);
    return unwrap<User>(
      apiClient.patch('/user/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...withUploadProgress(onProgress),
      })
    );
  },

  updateCoverImage: (coverImage: File, onProgress?: UploadProgressHandler) => {
    const form = new FormData();
    form.append('coverImage', coverImage);
    return unwrap<User>(
      apiClient.patch('/user/cover-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...withUploadProgress(onProgress),
      })
    );
  },

  getChannelProfile: (username: string) => unwrap<ChannelProfile>(apiClient.get(`/user/c/${username}`)),

  getWatchHistory: () => unwrap<RawPaginated<Video> | Video[]>(apiClient.get('/user/history')),
};
