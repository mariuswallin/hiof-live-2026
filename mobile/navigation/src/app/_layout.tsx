import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Theme } from "@/constants/theme";
import { TasksProvider } from "@/context/tasks-context";

/**
 * ROT-LAYOUTEN - det ytterste laget i appen.
 *
 * Expo Router bygger navigasjonen fra MAPPESTRUKTUREN i src/app:
 *
 *   _layout.tsx            <- denne fila: rot-Stack
 *   new-task.tsx           <- modal, ligger OVER alt annet
 *   (drawer)/_layout.tsx   <- skuffen (Drawer)
 *     (tabs)/_layout.tsx   <- tab-baren nederst
 *       index.tsx          <- tab 1: Hjem           "/"
 *       tasks/_layout.tsx  <- tab 2: egen Stack     "/tasks"
 *         index.tsx        <- lista                 "/tasks"
 *         [id].tsx         <- detaljside            "/tasks/3"
 *         user/[userId].tsx<- eier av oppgaven      "/tasks/user/68"
 *       profile.tsx        <- tab 3: Profil         "/profile"
 *     settings.tsx         <- kun i skuffen         "/settings"
 *     about.tsx            <- kun i skuffen         "/about"
 *
 * - _layout.tsx  = "rammen" rundt alle filene i samme mappe (navigatoren).
 * - (parentes)   = GRUPPE. Organiserer filene, men blir IKKE en del av URL-en.
 * - [klammer]    = DYNAMISK segment. Verdien leses med useLocalSearchParams.
 *
 * Hvorfor Stack helt ytterst? Fordi modalen skal legge seg OPPÅ både skuffen
 * og tab-baren. Det som ligger høyere i treet, dekker det som ligger under.
 */

// Én QueryClient for hele appen. Lages UTENFOR komponenten, ellers får vi en
// ny (og tom cache) ved hver render.
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    // Skuffen dras inn med en sveipebevegelse. Gesture Handler trenger en rot.
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Providers ligger OVER navigatoren, så ALLE skjermer når dem. */}
      <QueryClientProvider client={queryClient}>
        <TasksProvider>
          <Stack
            screenOptions={{
              headerTintColor: Theme.primary,
              contentStyle: { backgroundColor: Theme.background },
            }}
          >
            {/* Skuffen har sine egne headere - skjul rot-Stackens. */}
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />

            {/* presentation: "modal" = glir opp nedenfra (iOS: kort-stil). */}
            <Stack.Screen
              name="new-task"
              options={{ presentation: "modal", title: "Ny oppgave" }}
            />

            <Stack.Screen name="+not-found" options={{ title: "Oops" }} />
          </Stack>
        </TasksProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
