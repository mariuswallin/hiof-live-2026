// STEG 2A: ekte innlogging mot webappen (før: hardkodet "Lara Croft").
// app/login.tsx (login) -> HER -> api/auth.ts
// HER (token) -> contexts/TasksContext.tsx -> api/tasks.ts
// HER (user) -> app/_layout.tsx (Stack.Protected), app/(tabs)/index.tsx (Logg ut)

import { login as loginApi, type ApiUser } from "@/api/auth";
// STEG 2A: useEffect er borte - ingen henter brukeren av seg selv lenger.
import { createContext, use, useState, type ReactNode } from "react";

// STEG 2A: typene kommer fra api/auth.ts, altså fra det webappen sender.
export type Role = ApiUser["role"];

export type User = ApiUser;

type AuthContextData = {
  user: User | null;
  // STEG 2A: tokenet som api/tasks.ts sender i Authorization.
  token: string | null;
  role?: Role;
  isAdmin: boolean;
  // STEG 2A: isLoading er borte. Uten bruker vises login.tsx i stedet.
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

  // STEG 2A: login.tsx kaller denne. Kaster hvis webappen sier nei, så
  // skjermen kan vise feilen.
  async function login(userId: number) {
    const result = await loginApi(userId);
    setToken(result.token);
    setUser(result.user);
  }

  // STEG 2A: user blir null -> Stack.Protected i _layout.tsx viser login.tsx.
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
