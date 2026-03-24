import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario } from '../types';
import { store } from '../store';

interface AuthContextType {
  user: Usuario | null;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    const saved = sessionStorage.getItem('dalia_user');
    if (saved) try { return JSON.parse(saved) as Usuario; } catch { }
    return null;
  });

  useEffect(() => {
    if (user) sessionStorage.setItem('dalia_user', JSON.stringify(user));
    else sessionStorage.removeItem('dalia_user');
  }, [user]);

  const login = (email: string, senha: string): boolean => {
    const u = store.usuarios.find(
      (x) => x.email.toLowerCase() === email.toLowerCase() && x.senha === senha
    );
    if (u) {
      setUser({ ...u });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const isAdmin = user ? user.papel === 'administrador' : false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
