import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../db/api';
import { realtime, Events } from '../db/realtime';
import { User } from '../db/types';

type Role = 'customer' | 'owner';

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  actualRole: Role | null; // The role the user logged in as
  previewAs: Role | null; // Preview override (for demo mode)
  loading: boolean;
  login: (emailOrPhone: string, password: string, role: Role) => Promise<void>;
  signup: (data: { name: string; email: string; phone: string; password: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  setPreviewAs: (role: Role | null) => void;
  isPreview: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [actualRole, setActualRole] = useState<Role | null>(null);
  const [previewAs, setPreviewAs] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await authApi.getCurrentUser();
    setUser(u);
    setActualRole(u?.role || null);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    const unsub = realtime.on(Events.SESSION_CHANGED, () => {
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  const login = useCallback(async (emailOrPhone: string, password: string, r: Role) => {
    const u = await authApi.login(emailOrPhone, password, r);
    setUser(u);
    setActualRole(u.role);
    setPreviewAs(null);
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; phone: string; password: string; role: Role }) => {
    const u = await authApi.signup(data);
    setUser(u);
    setActualRole(u.role);
    setPreviewAs(null);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setActualRole(null);
    setPreviewAs(null);
  }, []);

  const role = previewAs || actualRole;
  const isPreview = !!previewAs && previewAs !== actualRole;

  return (
    <AuthContext.Provider value={{ user, role, actualRole, previewAs, loading, login, signup, logout, setPreviewAs, isPreview }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
