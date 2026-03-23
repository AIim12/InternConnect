import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const timerIntervalRef = useRef(null);
  const logoutTimeoutRef = useRef(null);

  // 10 minutes in milliseconds
  const SESSION_TIMEOUT = 10 * 60 * 1000;

  // Start/reset the session timer
  const startSessionTimer = () => {
    // Clear any existing timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);

    // Set countdown to 10 minutes
    setTimeRemaining(600);

    // Update timer every second
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Logout after 10 minutes
    logoutTimeoutRef.current = setTimeout(() => {
      logout();
      alert('Your session has expired due to inactivity. Please login again.');
    }, SESSION_TIMEOUT);
  };

  // Activity event handler
  const handleActivity = () => {
    if (token) {
      startSessionTimer();
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (token) {
      // Validate token
      fetch('http://127.0.0.1:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.email) {
            setUser(data);
            startSessionTimer();
          } else {
            logout();
          }
        })
        .catch(() => logout());
    }
  }, []);

  // Add activity listeners
  useEffect(() => {
    if (!token) return;

    const events = ['click', 'keypress', 'mousemove', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [token]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    };
  }, []);

  const login = (tok, userData) => {
    localStorage.setItem('token', tok);
    setToken(tok);
    setUser(userData);
    startSessionTimer();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTimeRemaining(600);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
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
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        authFetch,
        timeRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
