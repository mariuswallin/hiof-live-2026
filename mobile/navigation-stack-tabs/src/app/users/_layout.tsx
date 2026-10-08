import { Stack } from "expo-router";

import { Theme } from "@/constants/theme";

/**
 * MAPPE MED DYNAMISK RUTE - UTENFOR TABS.
 *
 * Samme mønster som tasks/_layout.tsx (liste -> detalj), men mappen ligger
 * rett i app/, ikke i (tabs)/:
 *
 *   app/users/_layout.tsx    <- denne Stacken
 *   app/users/index.tsx      <- lista                "/users"
 *   app/users/[userId].tsx   <- én bruker            "/users/68"
 *
 * Derfor:
 * - INGEN tab-bar. Hele bunken legges oppå tabs, i rot-Stacken.
 * - /users/68 kan åpnes direkte (lenke, dyplenke, adressefelt) uten å gå
 *   via noen tab.
 *
 * Lista får tilbake-knapp selv om den er nederst i DENNE Stacken: Stacken er
 * nøstet inni rot-Stacken, og arver "tilbake" derfra.
 */

/**
 * Åpnes /users/68 direkte, ville denne Stacken bare inneholdt brukersiden.
 * initialRouteName legger lista UNDER, så "tilbake" går til alle brukere.
 * (Samme triks som i tasks/_layout.tsx.)
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function UsersStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.primary,
        contentStyle: { backgroundColor: Theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Brukere" }} />
      {/* Tittelen settes dynamisk inne i [userId].tsx, når navnet er hentet. */}
      <Stack.Screen name="[userId]" options={{ title: "Bruker" }} />
    </Stack>
  );
}
