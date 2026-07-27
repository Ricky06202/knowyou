import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch, setTokens, clearTokens, getAccessToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAccessToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getAccessToken();
    if (t) {
      setToken(t);
      apiFetch("/auth/me", { token: t })
        .then((data) => setUser(data))
        .catch(() => {
          clearTokens();
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setToken(data.tokens.accessToken);
    setUser(data.user);
  };

  const register = async (email, password, name) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: { email, password, name },
    });
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setToken(data.tokens.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    clearTokens();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
