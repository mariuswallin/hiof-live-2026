import { isAdmin, SessionUser } from "../auth-types";
import { createContext, ReactNode } from "react";

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
