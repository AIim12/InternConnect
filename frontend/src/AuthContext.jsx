import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetch('http://127.0.0.1:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(u => { if (u) setUser(u); else logout(); })
        .catch(logout);
    }
  }, [token]);

  const login = (tok, userData) => {
    localStorage.setItem('token', tok);
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const authFetch = (url, opts = {}) =>
    fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
