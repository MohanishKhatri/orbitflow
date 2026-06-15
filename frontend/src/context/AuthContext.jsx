import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // On mount, check if tokens exist and try to validate them
  useEffect(() => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');

    if (access && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        logout();
      }
    } else if (refresh && !access) {
      // Try to get a new access token from the refresh token
      refreshToken(refresh);
    }
    setIsReady(true);
  }, []);

  async function refreshToken(refresh) {
    try {
      const res = await api.post('/api/auth/token/refresh/', { refresh });
      localStorage.setItem('access_token', res.data.access);
    } catch {
      logout();
    }
  }

  async function login(username, password) {
    const res = await api.post('/api/auth/login/', { username, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    const userData = { username };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  }

  async function signup(username, email, password) {
    const res = await api.post('/api/auth/signup/', { username, email, password });
    return res.data;
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isReady, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
