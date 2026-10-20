import { createContext, use, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "user";

export type User = {
  id: string;
  name: string;
  role: Role;
};

type AuthContextData = {
  user: User | null;
  role?: Role;
  isAdmin: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<null | AuthContextData>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Her ville jeg kalt et api for å hente en bruker fra f.eks AppWrite
    // Eller trigge en login sekvens
    // Dette tar 500ms
    setUser({
      id: "1",
      name: "Lara Croft",
      role: "admin",
    });
  }, []);

  const isAdmin = user?.role === "admin";
  const isLoading = user === null;

  const value = {
    user,
    role: user?.role,
    isAdmin,
    isLoading,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth");
  }
  return context;
}
