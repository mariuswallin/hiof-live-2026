"use client";

import { createContext, use, type ReactNode } from "react";
import { isAdmin, type SessionUser } from "../auth-types";

type AuthContextValue = {
  user: SessionUser | null;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  user: SessionUser | null;
  children: ReactNode;
};

export function AuthProvider({ user, children }: AuthProviderProps) {
  const value = {
    user,
    isAdmin: isAdmin(user),
  };
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error("Invalid use of context. Must have AuthProvider");
  }
  return context;
}
