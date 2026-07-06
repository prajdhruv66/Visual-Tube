import { STORAGE_KEYS } from '@/constants/config';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.refreshToken),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
  },
};
