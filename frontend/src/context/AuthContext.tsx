"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, clearToken, getToken, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: User }>("/me")
      .then((res) => setUser(res.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await apiFetch<AuthResponse>("/register", {
      method: "POST",
      body: payload,
      auth: false,
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // abaikan error logout
    }
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
