import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { userApi, type LoginPayload, type RegisterPayload } from '@/services/api/userApi';
import { tokenStorage } from '@/utils/tokenStorage';
import type { User } from '@/types/models';
import type { UploadProgressHandler } from '@/services/api/apiClient';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload, onProgress?: UploadProgressHandler) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await userApi.getMe();
        setUser(me);
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('vt:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('vt:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await userApi.login(payload);
    tokenStorage.setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload, onProgress?: UploadProgressHandler) => {
    await userApi.register(payload, onProgress);
    await login({ email: payload.email, password: payload.password });
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await userApi.logout();
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, login, register, logout, setUser }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
