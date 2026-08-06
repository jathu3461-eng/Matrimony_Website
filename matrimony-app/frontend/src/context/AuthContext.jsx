import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, silently try to restore the session from the HttpOnly
  // cookie. If it's valid, the person is dropped straight into their
  // dashboard — Signup/Login is only shown again after an explicit logout.
  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      // Bodyless POST requests are blocked by the host's WAF, so send `{}`.
      await api.post('/auth/logout', {});
    } catch {
      // Always clear local state. The HttpOnly cookie is cleared server-side;
      // if that call failed, the next /auth/me will 401 and drop the session.
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
