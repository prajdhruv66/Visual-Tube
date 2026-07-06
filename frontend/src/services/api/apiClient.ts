import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { tokenStorage } from '@/utils/tokenStorage';
import type { ApiErrorResponse, ApiResponse } from '@/types/api';

/**
 * The backend issues tokens both as httpOnly cookies and in the JSON body.
 * We send credentials so the cookie pair works automatically, and we also
 * attach the access token as a Bearer header so the app works the same way
 * even if the API is ever hosted cross-origin without shared cookies.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

/** Broadcast so AuthContext can clear state without a circular import. */
export function emitUnauthorized() {
  window.dispatchEvent(new CustomEvent('vt:unauthorized'));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/user/login') || originalRequest?.url?.includes('/user/register');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${API_BASE_URL}/user/regenerate-tokens`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true }
        );

        const newAccessToken = data.data.accessToken;
        tokenStorage.setTokens(newAccessToken, data.data.refreshToken);
        flushQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        tokenStorage.clear();
        emitUnauthorized();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Extracts a human-readable message from any Axios/API error. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    if (apiError?.message) return apiError.message;
    if (error.code === 'ECONNABORTED') return 'Request timed out. Check your connection and try again.';
    if (!error.response) return 'Network error. Check your connection and try again.';
  }
  return fallback;
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data;
}

export type UploadProgressHandler = (percent: number) => void;

export function withUploadProgress(onProgress?: UploadProgressHandler): AxiosRequestConfig {
  if (!onProgress) return {};
  return {
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  };
}
