import { login as loginApi, type ApiUser } from "@/api/auth";
import { createContext, use, useState, type ReactNode } from "react";

export type Role = ApiUser["role"];

export type User = ApiUser;

type AuthContextData = {
  user: User | null;
  token: string | null;
  role?: Role;
  isAdmin: boolean;
  login: (userId: number) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<null | AuthContextData>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // Bare i minnet, så du må logge inn igjen når appen starter på nytt.
  // Skal det huskes: expo-secure-store, ikke AsyncStorage (som er ukryptert).
  const [token, setToken] = useState<string | null>(null);

  async function login(userId: number) {
    const result = await loginApi(userId);
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    // USIKKERT: appen glemmer tokenet, men serveren kan ikke gjøre det ugyldig
    setToken(null);
    setUser(null);
  }

  const isAdmin = user?.role === "admin";

  const value = {
    user,
    token,
    role: user?.role,
    isAdmin,
    login,
    logout,
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
