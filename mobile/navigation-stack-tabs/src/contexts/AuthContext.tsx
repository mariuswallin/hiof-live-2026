import { createContext, use, useState, type ReactNode } from "react";

import { login as loginApi, type ApiUser } from "@/api/auth";
import { clear } from "@/api/cache";

export type Role = ApiUser["role"];

export type User = ApiUser;

/**
 * AUTH CONTEXT - hvem er innlogget, og hvilken ROLLE har hen?
 *
 * Samme mønster som TasksContext (Provider + hook). Innloggingen skjer mot
 * webappen (api/auth.ts), som svarer med brukeren og et TOKEN. Begge legges
 * i state her, og tokenet sendes med på alle kall til /api/v1/tasks.
 *
 * HVOR LENGE "LEVER" INNLOGGINGEN?
 *
 *   1. Appen starter (eller refreshes)
 *        AuthProvider mountes -> useState(null) -> user = null, token = null.
 *        Ingen er innlogget. Stack.Protected i rot-_layout.tsx viser bare
 *        /login.
 *
 *   2. Brukeren velger konto på /login
 *        login(userId) -> POST /api/v1/login -> { token, user }
 *
 *   3. Svaret kommer -> setToken + setUser
 *        Alle komponenter som kaller useAuth() rendres på nytt med brukeren.
 *        Stack.Protected bytter fra /login til appen, og TasksProvider henter
 *        lista MED tokenet. Rollen følger med: isAdmin avgjør om /admin finnes.
 *
 *   4. Brukeren navigerer rundt (tabs, stack)
 *        AuthProvider ligger i rot-_layout.tsx, OVER navigatoren. Den
 *        unmountes aldri når skjermer byttes - samme token, INGEN ny innlogging.
 *
 *   5. Refresh / appen lukkes
 *        Context er bare vanlig React-state = JavaScript-minne. Når JS-en
 *        startes på nytt er tokenet borte, og vi er tilbake på steg 1:
 *        logg inn igjen.
 *
 * Hva er "refresh"?
 *   - Web:    F5 / last siden på nytt
 *   - Mobil:  "r" i Metro-terminalen, Reload i dev-menyen, eller at appen
 *             lukkes (av brukeren eller av OS-et i bakgrunnen) og startes igjen
 *   - Fast Refresh (du lagrer en fil) beholder vanligvis state. Lagrer du
 *     DENNE fila, lages provideren på nytt - og du er logget ut.
 *
 * Hvorfor ikke huske innloggingen?
 *   Det kan vi: lagre TOKENET i expo-secure-store (kryptert), ikke i
 *   AsyncStorage (ukryptert). Ved oppstart: les tokenet -> hent brukeren fra
 *   API-et -> sett context. Brukeren selv lagrer vi ikke: navn og ROLLE kan ha
 *   endret seg på serveren, så API-et er sannheten - context er bare en kopi
 *   mens appen kjører.
 */
type AuthContextData = {
  /** null = ingen er innlogget. */
  user: User | null;
  /** Fra innloggingen. Sendes med på alle kall til webappen (api/tasks.ts). */
  token: string | null;
  role?: Role;
  /** Snarvei for rollesjekken - ett sted bestemmer hva "admin" betyr. */
  isAdmin: boolean;
  /** Logg inn mot webappen. Å bytte konto er bare en ny innlogging. */
  login: (userId: number) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Starter ALLTID som null - ved oppstart er ingen innlogget.
  const [user, setUser] = useState<User | null>(null);
  // Bare i minnet, så du må logge inn igjen når appen starter på nytt.
  const [token, setToken] = useState<string | null>(null);

  async function login(userId: number) {
    // Sier webappen nei, kaster loginApi - og feilen går videre til
    // kalleren (login.tsx), som viser den.
    const result = await loginApi(userId);

    // Alt i cachen ble hentet med forrige token (se api/cache.ts).
    clear();

    // Er noen innlogget fra før (kontobytte), beholder vi dem til svaret
    // kommer, så appen blir stående. Når den nye brukeren settes, endres
    // isAdmin - og Stack.Protected i _layout.tsx reagerer med en gang: står
    // du på /admin, sendes du ut.
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    // USIKKERT: appen glemmer tokenet, men serveren kan ikke gjøre det ugyldig
    clear();
    setToken(null);
    setUser(null);
  }

  // Avledet verdi - regnes ut fra user, ikke egen state.
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext
      value={{ user, token, role: user?.role, isAdmin, login, logout }}
    >
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
