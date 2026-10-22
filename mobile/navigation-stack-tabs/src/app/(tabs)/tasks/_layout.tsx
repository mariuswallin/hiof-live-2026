import { Stack, type SuspenseFallbackProps } from "expo-router";

import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
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

/**
 * LASTER-SKJERM - en Expo Router-konvensjon (SDK 56+).
 *
 * Ruteren pakker HVER skjerm inn i sin egen <Suspense>. Eksporterer en
 * layout SuspenseFallback, brukes den for alle skjermene i mappen mens de
 * venter på et use(). Her: [id].tsx, mens den henter /api/v1/tasks/:id.
 *
 * params er URL-parameterne, så vi kan si HVA vi venter på.
 */
export function SuspenseFallback({ params }: SuspenseFallbackProps) {
  return (
    <Screen>
      <Loading label={`Henter oppgave ${params.id ?? ""} ...`} />
    </Screen>
  );
}

export default function TasksStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.primary,
        contentStyle: { backgroundColor: Theme.background },
      }}
    >
      {/* Rot-skjermen i Stacken. De andre får tilbake-knapp automatisk. */}
      <Stack.Screen name="index" options={{ title: "Oppgaver" }} />
      {/* Tittelen settes dynamisk inne i [id].tsx, når vi vet hvilken oppgave. */}
      <Stack.Screen name="[id]" options={{ title: "Oppgave" }} />
      <Stack.Screen name="user/[userId]" options={{ title: "Eier" }} />
    </Stack>
  );
}
