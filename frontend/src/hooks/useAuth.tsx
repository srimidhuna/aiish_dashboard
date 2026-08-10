import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  nbsCentre: string;
  setNbsCentre: (val: string) => void;
  login: (email: string, pass: string, nbsCentre?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [nbsCentre, setNbsCentre] = useState(() => localStorage.getItem('nbs_centre') || '');
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, pass: string, nbsCentreVal?: string) => {
    const res = await authService.login(email, pass);
    setUser(res);
    localStorage.setItem('auth_user', JSON.stringify(res));
    if (nbsCentreVal) {
      setNbsCentre(nbsCentreVal);
      localStorage.setItem('nbs_centre', nbsCentreVal);
    }
  };

  const logout = () => {
    authService.logout().catch(() => undefined);
    setUser(null);
    setNbsCentre('');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('nbs_centre');
  };

  // Sync nbsCentre changes to localStorage if it's updated manually mid-session
  useEffect(() => {
    if (nbsCentre) {
      localStorage.setItem('nbs_centre', nbsCentre);
    }
  }, [nbsCentre]);

  return (
    <AuthContext.Provider value={{ user, isLoading, nbsCentre, setNbsCentre, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
