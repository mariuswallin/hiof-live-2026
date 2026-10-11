"use client";

import { createContext, use, type ReactNode } from "react";
import type { SessionUser } from "../auth-types";
import { isAdmin } from "../role";

/**
 * CONTEXT: gjør brukeren tilgjengelig for alle klient-komponenter, uten å
 * sende den som prop gjennom hvert ledd (prop drilling).
 *
 *   AppLayout (server)     leser ctx.user, sender den hit ÉN gang
 *     AuthProvider         legger den i context
 *       TasksPage (server)
 *         TaskList         trenger den ikke, og slipper å sende den videre
 *           TaskItem       useAuth() -> skal slett-knappen vises?
 *
 * To "contexter" med nesten samme navn, og de er IKKE det samme:
 *
 *   ctx (rwsdk)        på serveren, én per forespørsel. Sannheten.
 *   context (React)    i nettleseren. En KOPI, til å tegne UI etter.
 *
 * Server-komponenter kan ikke lese React context. De leser `ctx.user` rett fra
 * requestInfo, slik Home og TasksPage gjør. Denne er for klient-komponentene.
 *
 * Provideren har med vilje INGEN state, og ingen login() eller logout(). Den
 * sender bare videre det serveren ga den. Logger du inn eller ut, rendrer
 * serveren layouten på nytt, og en ny `user` kommer inn som prop. Da kan
 * nettleseren aldri mene noe annet enn serveren om hvem du er.
 *
 * TANKE: Alt i context blir sendt til nettleseren og kan leses der. Hva bør
 * ALDRI ligge i en SessionUser?
 */
type AuthContextValue = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isAdmin: isAdmin(user),
  };

  // React 19: selve contexten er provideren. Før het det <AuthContext.Provider>.
  return <AuthContext value={value}>{children}</AuthContext>;
}

/**
 * Custom hook: skjuler HVOR brukeren kommer fra.
 *
 *   const { isAdmin } = useAuth();
 *
 * Det hooken svarer, bestemmer bare hva som VISES. En knapp som er skjult, er
 * ikke beskyttet: ruta bak den kan fortsatt kalles med curl. Derfor står den
 * ekte sjekken i servicen (task-service.ts), uansett hva UI-et gjør.
 */
export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth må brukes inne i <AuthProvider>");
  }

  return context;
}
