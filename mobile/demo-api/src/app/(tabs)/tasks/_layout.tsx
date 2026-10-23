// STEG 2: NY - Stack inne i Oppgaver-taben: tasks/index.tsx -> tasks/[id].tsx.
// (tabs)/_layout.tsx skjuler tab-headeren for denne, så Stacken tegner sin egen.

import { Stack } from "expo-router";

import { Theme } from "@/constants/theme";

/**
 * STEG 2: STACK INNE I EN TAB.
 *
 * Detaljsiden legges OPPÅ lista - tab-baren blir stående, og tilbake-knappen
 * kommer automatisk. Bytter du tab og kommer tilbake, ligger bunken der du
 * forlot den.
 */

/**
 * Åpnes /tasks/abc DIREKTE (dyplenke, eller en Link fra en annen tab), ville
 * Stacken bare inneholdt detaljsiden - og det finnes ingen "tilbake".
 * Ankeret legger lista under.
 *
 * STEG FIKS: `anchor` i stedet for `initialRouteName` (utgått i SDK 57).
 */
export const unstable_settings = {
  anchor: "index",
};

export default function TasksStackLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: Theme.primary }}>
      <Stack.Screen name="index" options={{ title: "Oppgaver" }} />
      {/* Tittelen settes dynamisk i [id].tsx, når vi vet hvilken oppgave. */}
      <Stack.Screen name="[id]" options={{ title: "Oppgave" }} />
    </Stack>
  );
}
