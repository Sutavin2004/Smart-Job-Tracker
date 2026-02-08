"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiClient } from "src/lib/api";

type User = {
  id: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // In Phase 9+, you can add a bootstrapping call here (e.g. /auth/me)
  useEffect(() => {
    // Example placeholder – currently just marks loading complete.
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{
      access_token: string;
      refresh_token: string;
    }>("/auth/login", { email, password }, false);

    setAccessToken(res.access_token);
    apiClient.setAccessToken(res.access_token);

    // Later you can decode token or call /me to populate id
    setUser({ id: "me", email });
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    apiClient.setAccessToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
