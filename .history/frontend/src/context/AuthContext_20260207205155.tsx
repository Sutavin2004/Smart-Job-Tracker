"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api";

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

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // No bootstrap yet → not loading
  const isLoading = false;

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<LoginResponse, LoginRequest>(
      "/auth/login",
      { email, password },
      false
    );

    setAccessToken(res.access_token);
    apiClient.setAccessToken(res.access_token);

    setUser({ id: "me", email });
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    apiClient.setAccessToken(null);
    window.location.href = "/login";
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
