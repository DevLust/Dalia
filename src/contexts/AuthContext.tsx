import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario } from '../types';
import {
  loginUsuario,
  logoutUsuario,
  restoreUsuarioFromSession,
  subscribeAuth,
} from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: Usuario | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  authLoading: boolean;
  authReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readCachedUser(): Usuario | null {
  const saved = sessionStorage.getItem('dalia_user');
  if (!saved) return null;
  try {
    return JSON.parse(saved) as Usuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() =>
    isSupabaseConfigured ? null : readCachedUser()
  );
  const [authLoading, setAuthLoading] = useState(false);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    let active = true;

    void (async () => {
      const restored = await restoreUsuarioFromSession();
      if (active) setUser(restored);
      if (active) setAuthReady(true);
    })();

    const unsubscribe = subscribeAuth((perfil) => {
      if (active) setUser(perfil);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) sessionStorage.setItem('dalia_user', JSON.stringify(user));
    else sessionStorage.removeItem('dalia_user');
  }, [user]);

  const login = async (email: string, senha: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const u = await loginUsuario(email, senha);
      if (u) {
        setUser({ ...u });
        return true;
      }
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await logoutUsuario();
    setUser(null);
  };

  const isAdmin = user ? user.papel === 'administrador' : false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, authLoading, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
