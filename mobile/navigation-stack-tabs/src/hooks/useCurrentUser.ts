import { useEffect, useState } from "react";

import { fetchCurrentUser, type AuthUser } from "@/api/auth";

/**
 * CUSTOM HOOK - innlogget bruker, hentet med fetchCurrentUser() fra api/auth.ts.
 *
 * En custom hook er bare en funksjon som starter med "use" og kaller andre
 * hooks. Her: samme useState + useEffect som i users/index.tsx, flyttet ut av
 * skjermen så flere skjermer kan bruke den.
 *
 * DUPLIKAT MED VILJE: AuthProvider (contexts/AuthContext.tsx) gjør nesten
 * det samme. Forskjellen er HVOR staten bor:
 *
 *   useCurrentUser()  Staten bor i komponenten som kaller hooken.
 *                     To skjermer = to kopier og to hentinger. Lukkes
 *                     skjermen, er brukeren borte - neste gang hentes den igjen.
 *
 *   useAuth()         Staten bor i AuthProvider, over navigatoren.
 *                     Én henting ved oppstart, delt av alle skjermer.
 *
 * Se i terminalen: "[auth] Henter ..." kommer hver gang du åpner
 * Innstillinger (som bruker denne hooken) - men ikke når du bytter tab.
 *
 * Og: bytter du konto på Profil (loginAs), oppdateres AuthProvider og alle
 * som bruker useAuth(). Denne hooken vet ingenting om det - den har sin egen
 * kopi. Derfor bruker RootNavigator useAuth() til Stack.Protected, ikke denne.
 *
 * Det beste fra begge: kall hooken ÉN gang, inni en provider, og del
 * resultatet via context. Det er akkurat det contexts/AuthContextV2.tsx gjør.
 */
export function useCurrentUser() {
  // null = ikke hentet ennå.
  const [user, setUser] = useState<AuthUser | null>(null);

  // Kjører én gang når komponenten som bruker hooken, mountes.
  useEffect(() => {
    // fetchCurrentUser tar ikke imot et signal, så kallet kan ikke avbrytes.
    // I stedet ignorerer vi svaret hvis skjermen er borte før det kommer.
    let ignore = false;

    fetchCurrentUser().then((result) => {
      if (!ignore) setUser(result);
    });

    // Opprydding: kjøres når skjermen forsvinner.
    return () => {
      ignore = true;
    };
  }, []);

  /** Hent /me på nytt, men behold brukeren til svaret kommer. */
  function refetch() {
    fetchCurrentUser().then(setUser);
  }

  /** Tøm brukeren og hent på nytt - samme som skjer ved en refresh. */
  function reload() {
    setUser(null);
    refetch();
  }

  // Samme form som useAuth() (minus loginAs), så skjermene kan bytte mellom dem.
  return {
    user,
    isLoading: user === null,
    isAdmin: user?.role === "admin",
    reload,
    refetch,
  };
}
