import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Loading } from "@/components/shared/Loading";
import { Theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TasksProvider } from "@/contexts/TasksContext";

/**
 * ROT-LAYOUTEN - det ytterste laget i appen.
 *
 * Expo Router bygger navigasjonen fra MAPPESTRUKTUREN i src/app:
 *
 *   _layout.tsx            <- denne fila: rot-Stack
 *   new-task.tsx           <- modal, ligger OVER alt annet
 *   admin.tsx              <- BESKYTTET, kun admin     "/admin"
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
        {/*
          AuthProvider ytterst av våre egne providers:
          - Den mountes ÉN gang når appen starter og henter brukeren da.
          - Den unmountes aldri når vi navigerer, så brukeren "lever" i
            context helt til appen refreshes/lukkes (se AuthContext.tsx).
          - Over TasksProvider, fordi oppgaver hører til en bruker. Skal
            hver bruker ha sine egne oppgaver, kan TasksProvider bruke
            useAuth() for å vite HVEM den skal hente for.
        */}
        <AuthProvider>
          <TasksProvider>
            <RootNavigator />
          </TasksProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Egen komponent fordi den trenger useAuth() - og hooken virker bare INNI
 * <AuthProvider>. RootLayout over er den som lager provideren, så den kan
 * ikke bruke hooken selv.
 */
function RootNavigator() {
  const { isLoading, isAdmin } = useAuth();

  // Før brukeren er hentet vet vi ikke rollen. Viser vi appen nå, er isAdmin
  // false - og en admin som refresher på /admin blir kastet ut før svaret
  // kommer. Derfor: ingen navigator før vi vet hvem brukeren er.
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Loading label="Henter bruker ..." />
      </View>
    );
  }

  return (
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

      {/*
        BESKYTTET RUTE. guard={false} = ruten finnes ikke for denne brukeren:
        - Link/router.push/dyplenke til /admin -> sendes til "/" i stedet.
        - Står man PÅ /admin og guard blir false (f.eks. bytter til vanlig
          bruker), sendes man ut automatisk og /admin fjernes fra historikken.

        Ligger i rot-Stacken (som modalen), så den kan åpnes fra hvor som
        helst og legger seg over både skuff og tab-bar.

        NB: dette skjuler bare skjermen i APPEN. Dataene må beskyttes på
        serveren - API-et må selv sjekke rollen på hver forespørsel.
      */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="admin" options={{ title: "Admin" }} />
      </Stack.Protected>

      <Stack.Screen name="+not-found" options={{ title: "Oops" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.background,
  },
});
