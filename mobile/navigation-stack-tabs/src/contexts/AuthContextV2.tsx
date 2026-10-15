import { createContext, use, type ReactNode } from "react";

import { simulateLogin, type AuthUser, type Role } from "@/api/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * AUTH CONTEXT V2 - samme som AuthContext.tsx, men hentingen er flyttet ut
 * i en CUSTOM HOOK (hooks/useCurrentUser.ts).
 *
 * V1 (AuthContext.tsx) gjør alt selv: useState + useEffect + fetch.
 * V2 deler ansvaret i to:
 *
 *   useCurrentUser()  HVORDAN brukeren hentes (state, effekt, reload).
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
 * i ALLE filene som bruker den. To ulike contexter kan ikke blandes: en
 * skjerm som leser V1 under en V2-provider, finner ingen provider og kaster.
 */
type AuthContextData = {
  /** null = ikke hentet ennå (eller ikke innlogget). */
  user: AuthUser | null;
  isLoading: boolean;
  /** Snarvei for rollesjekken - ett sted bestemmer hva "admin" betyr. */
  isAdmin: boolean;
  /** Tøm brukeren og hent på nytt - samme som skjer ved en refresh. */
  reload: () => void;
  /** Simulert innlogging med en annen konto, så vi kan teste rollene. */
  loginAs: (role: Role) => void;
};

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // All henting skjer i hooken. Provideren mountes én gang, så hooken kjører
  // én gang - og alle skjermer leser det samme svaret.
  const { user, isLoading, isAdmin, reload, refetch } = useCurrentUser();

  function loginAs(role: Role) {
    simulateLogin(role); // "logg inn" med en annen konto (ny token)

    // refetch, ikke reload: behold den gamle brukeren til svaret kommer, så
    // appen blir stående. Når den nye brukeren settes, endres isAdmin - og
    // Stack.Protected i _layout.tsx reagerer med en gang.
    refetch();
  }

  return (
    <AuthContext value={{ user, isLoading, isAdmin, reload, loginAs }}>
      {children}
    </AuthContext>
  );
}

/** Hook for skjermene. Kaster hvis noen glemmer AuthProvider. */
export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth må brukes inne i <AuthProvider>");
  }

  return context;
}
