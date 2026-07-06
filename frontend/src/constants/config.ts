export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const STORAGE_KEYS = {
  accessToken: 'vt_access_token',
  refreshToken: 'vt_refresh_token',
} as const;

export const MAX_UPLOAD_VIDEO_SIZE_MB = 500;
export const MAX_UPLOAD_IMAGE_SIZE_MB = 5;
