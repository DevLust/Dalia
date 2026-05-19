import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario } from '../types';
import { loginUsuario } from '../lib/db';

interface AuthContextType {
  user: Usuario | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    const saved = sessionStorage.getItem('dalia_user');
    if (saved) {
      try {
        return JSON.parse(saved) as Usuario;
      } catch {
        void 0;
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(false);

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

  const logout = () => setUser(null);

  const isAdmin = user ? user.papel === 'administrador' : false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
