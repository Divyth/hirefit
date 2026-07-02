import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { fetchProfile } from '../services/authService';
import axios from 'axios';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setSession: (session: { token: string; user: User } | null) => void;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hirefit_token'));
  const [loading, setLoading] = useState(true);

  const setSession = (session: { token: string; user: User } | null) => {
    if (!session) {
      localStorage.removeItem('hirefit_token');
      setToken(null);
      setUser(null);
      return;
    }
    localStorage.setItem('hirefit_token', session.token);
    setToken(session.token);
    setUser(session.user);
  };

  const logout = () => setSession(null);

  const refresh = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user: profile } = await fetchProfile();
      setUser(profile);
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, setSession, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
