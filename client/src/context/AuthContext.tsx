import React, { createContext, useCallback, useContext, useState } from 'react';
import type { User } from '../api/auth.js';
import { login as apiLogin } from '../api/auth.js';

const STORAGE_KEY = 'inventory_auth';

function loadStored(): { token: string; user: User } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { token: string; user: User };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ token: string; user: User } | null>(loadStored);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const data = { token: res.token, user: res.user };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setState(data);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(null);
  }, []);

  const value: AuthContextValue = {
    user: state?.user ?? null,
    token: state?.token ?? null,
    login,
    logout,
    isAuthenticated: !!state?.token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
