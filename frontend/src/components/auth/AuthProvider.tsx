"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AUTH_ENABLED,
  canAccess,
  clearSession,
  DEFAULT_USER,
  getSession,
  type DemoUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: DemoUser | null;
  loading: boolean;
  logout: () => void;
  setUser: (user: DemoUser | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setUser(DEFAULT_USER);
      setLoading(false);
      return;
    }
    const session = getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading || !AUTH_ENABLED) return;
    if (pathname === "/login") return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccess(user.role, pathname)) {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (!AUTH_ENABLED && pathname === "/login") {
      router.replace("/");
    }
  }, [pathname, router]);

  const logout = useCallback(() => {
    if (!AUTH_ENABLED) return;
    clearSession();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}