import { createContext, use, type ReactNode } from "react";

import type { ApiUser } from "@/api/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * AUTH CONTEXT V2 - samme som AuthContext.tsx, men staten og login/logout er
 * flyttet ut i en CUSTOM HOOK (hooks/useCurrentUser.ts).
 *
 * V1 (AuthContext.tsx) gjør alt selv: useState + login() + logout().
 * V2 deler ansvaret i to:
 *
 *   useCurrentUser()  HVORDAN innloggingen virker (state, login, logout).
 *   AuthProvider      HVEM som får den - kaller hooken ÉN gang og deler
 *                     resultatet med alle skjermer via context.
 *
 * Hooken alene gir hver skjerm sin egen kopi (se settings.tsx). Hooken INNI
 * en provider gir én kopi for hele appen - fordi provideren ligger over
 * navigatoren og bare mountes én gang. Livsløpet er det samme som i V1 (se
 * kommentaren øverst i AuthContext.tsx).
 *
 * Skjermene merker ingen forskjell: samme AuthProvider, samme useAuth(),
 * samme verdier. Bytt versjon ved å endre importen fra
 *   "@/contexts/AuthContext"  til  "@/contexts/AuthContextV2"
 * i ALLE filene som bruker den (søk etter "@/contexts/AuthContext"). To ulike
 * contexter kan ikke blandes: en skjerm som leser V1 under en V2-provider,
 * finner ingen provider og kaster.
 */
type AuthContextData = {
  /** null = ingen er innlogget. */
  user: ApiUser | null;
  /** Fra innloggingen. Sendes med på alle kall til webappen (api/tasks.ts). */
  token: string | null;
  role?: ApiUser["role"];
  /** Snarvei for rollesjekken - ett sted bestemmer hva "admin" betyr. */
  isAdmin: boolean;
  /** Logg inn mot webappen. Å bytte konto er bare en ny innlogging. */
  login: (userId: number) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // All state bor i hooken. Provideren mountes én gang, så det finnes én
  // kopi - og alle skjermer leser den samme.
  const auth = useCurrentUser();

  return <AuthContext value={auth}>{children}</AuthContext>;
}

/** Hook for skjermene. Kaster hvis noen glemmer AuthProvider. */
export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth må brukes inne i <AuthProvider>");
  }

  return context;
}
