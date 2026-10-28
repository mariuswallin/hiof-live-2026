import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { Suspense } from "react";
import { StyleSheet, View } from "react-native";

import { forget } from "@/api/cache";
import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { Theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TASKS_KEY, TasksProvider } from "@/contexts/TasksContext";

/**
 * ROT-LAYOUTEN - det ytterste laget i appen.
 *
 * Expo Router bygger navigasjonen fra MAPPESTRUKTUREN i src/app:
 *
 *   _layout.tsx            <- denne fila: rot-Stack
 *   login.tsx              <- kun når ingen er innlogget      "/login"
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

/**
 * FEIL-SKJERM - en Expo Router-konvensjon: eksporter ErrorBoundary fra en
 * rutefil, så pakker ruteren den inn i en React error boundary.
 *
 * Kaster noe under her som ingen nærmere ErrorBoundary fanger, vises denne i
 * stedet for appen. Typisk: use() i TasksProvider når GET /api/v1/tasks feiler.
 *
 * "Prøv igjen": glem promiset som feilet (se api/cache.ts), og la retry()
 * rendre layouten på nytt. Da starter use() en ny henting.
 *
 * NB: AuthProvider ligger også INNI denne boundaryen. retry() lager den på
 * nytt - tokenet er borte, og du må logge inn igjen (som etter en refresh).
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.loading}>
      <Empty
        title="Noe gikk galt"
        hint={error.message}
        actionLabel="Prøv igjen"
        onPress={() => {
          forget(TASKS_KEY);
          retry();
        }}
      />
    </View>
  );
}

// Én QueryClient for hele appen. Lages UTENFOR komponenten, ellers får vi en
// ny (og tom cache) ved hver render.
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    // Providers ligger OVER navigatoren, så ALLE skjermer når dem.
    <QueryClientProvider client={queryClient}>
      {/*
        AuthProvider ytterst av våre egne providers:
        - Den mountes ÉN gang når appen starter. Da er ingen innlogget.
        - Den unmountes aldri når vi navigerer, så innloggingen "lever" i
          context helt til appen refreshes/lukkes (se AuthContext.tsx).
        - Over TasksProvider, fordi oppgaver hører til en bruker:
          TasksProvider bruker useAuth() for å sende tokenet til webappen.
      */}
      <AuthProvider>
        {/*
          SUSPENSE (React 19): TasksProvider henter lista med use(). Mens den
          venter, vises fallback i stedet for alt inni <Suspense>. Ingen
          skjerm trenger egen "laster"-sjekk for oppgavene.

          Før innlogging hentes ingenting. Etter login() (og ved kontobytte)
          vises fallbacken til den nye brukerens liste er hentet.
        */}
        <Suspense
          fallback={
            <View style={styles.loading}>
              <Loading label="Henter oppgaver ..." />
            </View>
          }
        >
          <TasksProvider>
            <RootNavigator />
          </TasksProvider>
        </Suspense>
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
  const { user, isAdmin } = useAuth();

  // Når user settes (login) eller fjernes (logout), bytter Stack.Protected
  // skjerm selv - ingen router.replace("/login") noe sted.
  const isLoggedIn = user !== null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.primary,
        contentStyle: { backgroundColor: Theme.background },
      }}
    >
      {/*
        INNLOGGING. Finnes bare når ingen er innlogget. Alt annet finnes bare
        når noen ER det - så uten innlogging er /login den eneste skjermen.
        Dyplenker til /tasks/3 o.l. sendes hit.
      */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ title: "Logg inn" }} />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
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
          BESKYTTET RUTE, inni den forrige. guard={false} = ruten finnes ikke
          for denne brukeren:
          - Link/router.push/dyplenke til /admin -> sendes til "/" i stedet.
          - Står man PÅ /admin og guard blir false (f.eks. bytter til vanlig
            bruker), sendes man ut automatisk og /admin fjernes fra historikken.

          Ligger i rot-Stacken (som new-task), så den kan åpnes fra hvor som
          helst og legger seg over tab-baren.

          NB: dette skjuler bare skjermen i APPEN. Dataene må beskyttes på
          serveren - og det gjør webappen: DELETE /api/v1/tasks/:id svarer 403
          for alle som ikke er admin.
        */}
        <Stack.Protected guard={isAdmin}>
          <Stack.Screen name="admin" options={{ title: "Admin" }} />
        </Stack.Protected>
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
