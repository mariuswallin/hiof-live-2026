import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

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
 *   new-task.tsx           <- skjema, legges OPPÅ tab-baren   "/new-task"
 *   settings.tsx           <- utenfor tabs                    "/settings"
 *   about.tsx              <- utenfor tabs                    "/about"
 *   admin.tsx              <- BESKYTTET, kun admin            "/admin"
 *   users/_layout.tsx      <- egen Stack, utenfor tabs        "/users"
 *     index.tsx            <- alle brukere          "/users"
 *     [userId].tsx         <- én bruker             "/users/68"
 *   (tabs)/_layout.tsx     <- tab-baren nederst
 *     index.tsx            <- tab 1: Hjem           "/"
 *     tasks/_layout.tsx    <- tab 2: egen Stack     "/tasks"
 *       index.tsx          <- lista                 "/tasks"
 *       [id].tsx           <- detaljside            "/tasks/3"
 *       user/[userId].tsx  <- eier av oppgaven      "/tasks/user/68"
 *     profile.tsx          <- tab 3: Profil         "/profile"
 *
 * - _layout.tsx  = "rammen" rundt alle filene i samme mappe (navigatoren).
 * - (parentes)   = GRUPPE. Organiserer filene, men blir IKKE en del av URL-en.
 * - [klammer]    = DYNAMISK segment. Verdien leses med useLocalSearchParams.
 *
 * Hvorfor Stack helt ytterst? Fordi skjermene som ligger UTENFOR (tabs)
 * (ny oppgave, innstillinger, om, brukere, admin) skal legges OPPÅ
 * tab-baren. Det som ligger høyere i treet, dekker det som ligger under.
 */

/**
 * Åpnes en skjerm utenfor tabs DIREKTE (dyplenke, adressefelt), f.eks.
 * /users/68, ville rot-Stacken bare inneholdt den - og det finnes ingen vei
 * "tilbake". initialRouteName legger tabs UNDER, så tilbake ender på Hjem.
 * (Samme triks som i tasks/_layout.tsx og users/_layout.tsx, ett nivå opp.)
 */
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Én QueryClient for hele appen. Lages UTENFOR komponenten, ellers får vi en
// ny (og tom cache) ved hver render.
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    // Providers ligger OVER navigatoren, så ALLE skjermer når dem.
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
      {/* Tab-baren har sine egne headere - skjul rot-Stackens. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/*
        Vanlige Stack-skjermer UTENFOR tabs. De legges oppå tab-baren og får
        rot-Stackens header med tilbake-knapp automatisk.
      */}
      <Stack.Screen name="new-task" options={{ title: "Ny oppgave" }} />
      <Stack.Screen name="settings" options={{ title: "Innstillinger" }} />
      <Stack.Screen name="about" options={{ title: "Om appen" }} />

      {/*
        Mappe med egen Stack (users/_layout.tsx) - samme mønster som
        Oppgaver-taben, men utenfor tabs. Den har egen header, så vi skjuler
        rot-Stackens. Ellers får vi to headere oppå hverandre.
      */}
      <Stack.Screen name="users" options={{ headerShown: false }} />

      {/*
        BESKYTTET RUTE. guard={false} = ruten finnes ikke for denne brukeren:
        - Link/router.push/dyplenke til /admin -> sendes til "/" i stedet.
        - Står man PÅ /admin og guard blir false (f.eks. bytter til vanlig
          bruker), sendes man ut automatisk og /admin fjernes fra historikken.

        Ligger i rot-Stacken (som new-task), så den kan åpnes fra hvor som
        helst og legger seg over tab-baren.

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
