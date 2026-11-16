import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getApiErrorMessage } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        setUser(data.data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus('guest');
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.data.user);
      setStatus('authenticated');
      return data.data.user;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to sign in'));
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const { data } = await api.post('/auth/register', payload);
      setUser(data.data.user);
      setStatus('authenticated');
      return data.data.user;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to create your account'));
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    setUser(null);
    setStatus('guest');
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
    setStatus('authenticated');
    return data.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export default AuthContext;
