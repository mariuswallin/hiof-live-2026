import { useState } from "react";

import { login as loginApi, type ApiUser } from "@/api/auth";
import { clear } from "@/api/cache";

/**
 * CUSTOM HOOK - innlogget bruker: token + bruker i state, og login()/logout().
 *
 * En custom hook er bare en funksjon som starter med "use" og kaller andre
 * hooks. Her: de samme useState-ene og login/logout som i AuthProvider
 * (contexts/AuthContext.tsx), flyttet ut så de kan gjenbrukes.
 *
 * DUPLIKAT MED VILJE. Forskjellen er HVOR staten bor:
 *
 *   useCurrentUser()  Staten bor i komponenten som kaller hooken.
 *                     To skjermer = to kopier. Lukkes skjermen, er kopien
 *                     borte.
 *
 *   useAuth()         Staten bor i AuthProvider, over navigatoren.
 *                     Én kopi, delt av alle skjermer.
 *
 * Se Innstillinger, som kaller denne hooken selv: der er INGEN innlogget,
 * selv om du er det på Profil. Skjermen får sin egen, tomme kopi - tokenet
 * fra /login ligger i AuthProvider. Derfor bruker RootNavigator useAuth() til
 * Stack.Protected, ikke denne.
 *
 * Det beste fra begge: kall hooken ÉN gang, inni en provider, og del
 * resultatet via context. Det er akkurat det contexts/AuthContextV2.tsx gjør.
 */
export function useCurrentUser() {
  // null = ingen er innlogget - i DENNE kopien.
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function login(userId: number) {
    const result = await loginApi(userId);
    // Alt i cachen ble hentet med forrige token (se api/cache.ts).
    clear();
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    clear();
    setToken(null);
    setUser(null);
  }

  // Samme form som useAuth(), så AuthContextV2 kan dele den rett videre.
  return {
    user,
    token,
    role: user?.role,
    isAdmin: user?.role === "admin",
    login,
    logout,
  };
}
