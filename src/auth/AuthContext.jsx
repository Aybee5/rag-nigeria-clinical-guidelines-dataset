import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
axios.defaults.baseURL = "https://healthbot.com.ng";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("access_token"),
  );

  const [loading, setLoading] = useState(!!token);

  // Configure axios interceptors to attach token and handle 401 globally
  useEffect(() => {
    const req = axios.interceptors.request.use((cfg) => {
      if (token) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    const res = axios.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err.response && err.response.status === 401) {
          // clear local auth state on 401
          setUser(null);
          setToken(null);
          localStorage.removeItem("access_token");
        }
        return Promise.reject(err);
      },
    );

    return () => {
      axios.interceptors.request.eject(req);
      axios.interceptors.response.eject(res);
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (e) {
        console.warn("Failed to fetch current user", e);
        setToken(null);
        localStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post("/auth/login", { email, password });
    const access_token = res.data.access_token;
    setToken(access_token);
    localStorage.setItem("access_token", access_token);
    const me = res.data.user;
    setUser(me);
    return me;
  };

  const register = async (email, password) => {
    const res = await axios.post("/auth/register", { email, password });
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post(
        "/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("access_token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
