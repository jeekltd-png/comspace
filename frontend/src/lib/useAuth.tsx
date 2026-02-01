'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, logout as reduxLogout } from '@/store/slices/authSlice';

type User = any;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUser = async () => {
    try {
      const resp = await apiClient.get('/auth/me');
      setUser(resp.data.data.user);
      // keep redux in sync
      const token = localStorage.getItem('token') || '';
      const refreshToken = localStorage.getItem('refreshToken') || '';
      if (resp.data?.data?.user) {
        dispatch(setCredentials({ user: resp.data.data.user, token, refreshToken } as any));
      }
    } catch (e) {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      dispatch(reduxLogout());
    }
  };

  const login = async (token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    dispatch(reduxLogout());
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
