import { Stack } from "expo-router";
import { DrawerToggleButton } from "expo-router/drawer";

import { Theme } from "@/constants/theme";

/**
 * STACK INNE I EN TAB.
 *
 * Oppgaver-taben har sin egen "bunke" med skjermer:
 *   liste -> detalj -> eier
 * Bytter du tab og kommer tilbake, ligger bunken der du forlot den.
 *
 * Detaljsiden er IKKE en egen tab - den legges oppå lista, så tab-baren
 * blir stående og tilbake-knappen kommer automatisk.
 */

/**
 * Hopper vi rett til "/tasks/3" fra en annen tab (eller via en lenke utenfra),
 * vil Stacken bare inneholde detaljsiden - og da er det ingen "tilbake".
 * initialRouteName sørger for at lista alltid ligger UNDER.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function TasksStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.primary,
        contentStyle: { backgroundColor: Theme.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Oppgaver",
          // Bare rot-skjermen i Stacken skal ha ☰. De andre får "tilbake".
          headerLeft: () => <DrawerToggleButton tintColor={Theme.primary} />,
        }}
      />
      {/* Tittelen settes dynamisk inne i [id].tsx, når vi vet hvilken oppgave. */}
      <Stack.Screen name="[id]" options={{ title: "Oppgave" }} />
      <Stack.Screen name="user/[userId]" options={{ title: "Eier" }} />
    </Stack>
  );
}
