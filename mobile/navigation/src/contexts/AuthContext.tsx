import { createContext, use, useEffect, useState, type ReactNode } from "react";

import {
  fetchCurrentUser,
  simulateLogin,
  type AuthUser,
  type Role,
} from "@/api/auth";

/**
 * AUTH CONTEXT - hvem er innlogget bruker, og hvilken ROLLE har hen?
 *
 * Samme mønster som TasksContext (Provider + hook), men dataene kommer fra
 * et API i stedet for en konstant.
 *
 * HVOR LENGE "LEVER" BRUKEREN?
 *
 *   1. Appen starter (eller refreshes)
 *        AuthProvider mountes -> useState(null) -> user = null.
 *        Minnet er tomt. Vi VET ikke hvem brukeren er, eller hvilken rolle
 *        hen har. Derfor viser rot-_layout.tsx bare "Henter bruker ..." -
 *        appen (og Stack.Protected) vises først når vi vet.
 *
 *   2. useEffect(..., []) kjører etter første render
 *        fetchCurrentUser() -> "GET /me"
 *
 *   3. Svaret kommer -> setUser(user)
 *        Alle komponenter som kaller useAuth() rendres på nytt med brukeren.
 *        Rollen følger med: isAdmin avgjør om /admin er tilgjengelig.
 *
 *   4. Brukeren navigerer rundt (tabs, stack, skuff, modal)
 *        AuthProvider ligger i rot-_layout.tsx, OVER navigatoren. Den
 *        unmountes aldri når skjermer byttes - samme user, INGEN ny henting.
 *
 *   5. Refresh / appen lukkes
 *        Context er bare vanlig React-state = JavaScript-minne. Når JS-en
 *        startes på nytt er alt borte, og vi er tilbake på steg 1.
 *        Derfor MÅ provideren alltid hente brukeren selv ved oppstart.
 *
 * Hva er "refresh"?
 *   - Web:    F5 / last siden på nytt
 *   - Mobil:  "r" i Metro-terminalen, Reload i dev-menyen, eller at appen
 *             lukkes (av brukeren eller av OS-et i bakgrunnen) og startes igjen
 *   - Fast Refresh (du lagrer en fil) beholder vanligvis state. Lagrer du
 *     DENNE fila, lages provideren på nytt - og brukeren hentes igjen.
 *
 * Hvorfor ikke lagre brukeren i AsyncStorage og slippe å hente?
 *   I en ekte app lagrer vi en TOKEN (f.eks. expo-secure-store), ikke selve
 *   brukeren. Ved oppstart: les token -> hent /me -> sett context. Brukerdata
 *   kan ha endret seg på serveren (nytt navn, ROLLE fjernet, sperret konto),
 *   så API-et er sannheten - context er bare en kopi mens appen kjører.
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
  // Starter ALLTID som null - ved oppstart finnes ingen bruker i minnet.
  const [user, setUser] = useState<AuthUser | null>(null);

  // Tomt dependency-array = kjør én gang når provideren mountes.
  // Provideren mountes én gang per oppstart/refresh - altså hentes brukeren
  // på nytt hver gang appen starter, og aldri ellers.
  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  function reload() {
    setUser(null); // som etter en refresh: vi vet ikke hvem brukeren er
    fetchCurrentUser().then(setUser);
  }

  function loginAs(role: Role) {
    simulateLogin(role); // "logg inn" med en annen konto (ny token)

    // Hent /me på nytt. Her beholder vi den gamle brukeren til svaret
    // kommer (ingen setUser(null)), så appen blir stående. Når den nye
    // brukeren settes, endres isAdmin - og Stack.Protected i _layout.tsx
    // reagerer med en gang: står du på /admin, sendes du ut.
    fetchCurrentUser().then(setUser);
  }

  // Den fake API-funksjonen feiler aldri. Mot et ekte API trenger vi også
  // en feil-tilstand (utløpt token -> send brukeren til innlogging).
  const isLoading = user === null;

  // Avledet verdi - regnes ut fra user, ikke egen state.
  const isAdmin = user?.role === "admin";

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
