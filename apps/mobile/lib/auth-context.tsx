import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/api";
import { authApi } from "@/lib/api";

const TOKEN_KEY = "ideamode_token";
const USER_KEY = "ideamode_user_json";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, uJson] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (cancelled) return;
        if (t && uJson) {
          setToken(t);
          try {
            setUser(JSON.parse(uJson) as User);
          } catch {
            setUser(null);
          }
          const me = await authApi.me(t).catch(() => null);
          if (!cancelled && me?.user) {
            setUser(me.user);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(me.user));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAuth = useCallback(async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const me = await authApi.me(token);
    setUser(me.user);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(me.user));
  }, [token]);

  const value = useMemo(
    () => ({ token, user, loading, setAuth, logout, refreshMe }),
    [token, user, loading, setAuth, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
