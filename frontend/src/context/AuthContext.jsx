import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, removeToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/api/profile');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        removeToken();
        setUser(null);
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username_or_email, password) => {
    const res = await api.post('/api/login', { username_or_email, password });
    if (res.success && res.data?.access_token) {
      setToken(res.data.access_token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, username, email, password, interests) => {
    const res = await api.post('/api/register', { name, username, email, password, interests });
    if (res.success && res.data?.access_token) {
      setToken(res.data.access_token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/api/logout');
    } catch (e) {
      // Ignored
    } finally {
      removeToken();
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
