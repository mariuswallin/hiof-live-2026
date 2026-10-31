// STEG 2A: Stack.Protected. Uten bruker: bare login.tsx. Med bruker: alt annet.
// contexts/AuthContext.tsx (user) -> HER -> login.tsx eller (tabs)
// STEG 2B: rot-Stacken får (tabs) i stedet for index.
// HER -> (tabs)/_layout.tsx (tab-bar) -> (tabs)/tasks/_layout.tsx (Stack i tab)
// HER -> new-task.tsx (oppå tab-baren)

import { Theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { Stack } from "expo-router";

/**
 * STEG 2B: før "index". app/index.tsx er flyttet til (tabs)/index.tsx.
 *
 * Åpnes en skjerm utenfor tabs DIREKTE (dyplenke), f.eks. /about, ville
 * rot-Stacken bare inneholdt den - og ingen vei "tilbake". Ankeret legger
 * (tabs) under, så tilbake ender på Hjem.
 */
export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  // STEG 2A: user i stedet for isLoading. Det er ingen lasting lenger, bare
  // innlogget eller ikke.
  const { user, isAdmin } = useAuth();

  // Når user settes eller fjernes, bytter Stack.Protected skjerm selv.
  const validUser = user !== null && user !== undefined;

  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.primary,
      }}
    >
      {/* STEG 2A: bare når du IKKE er innlogget. */}
      <Stack.Protected guard={!validUser}>
        <Stack.Screen name="login" options={{ title: "Logg inn" }} />
      </Stack.Protected>

      {/*
        STEG 2A: alt annet krever innlogging. Logger du ut, finnes ikke disse
        skjermene lenger, og du havner på login.
      */}
      <Stack.Protected guard={validUser}>
        {/*
          STEG 2B: tab-baren. Tabs tegner sine egne headere - skjul
          rot-Stackens, ellers får vi to headere oppå hverandre.
        */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/*
          STEG 2B: skjemaet. Alt som ligger her i rot-Stacken, UTENFOR (tabs),
          legges OPPÅ tab-baren og får header med tilbake-knapp.
        */}
        <Stack.Screen name="new-task" options={{ title: "Ny oppgave" }} />
        <Stack.Screen
          name="about"
          options={{
            title: "Om oss",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
          }}
        />
        <Stack.Screen
          name="students"
          options={{
            headerShown: false,
          }}
        />
        {/* Vakt inni vakt: innlogget OG admin. */}
        <Stack.Protected guard={isAdmin}>
          <Stack.Screen name="admin" options={{ title: "Admin" }} />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    // STEG 2A: AuthProvider UTENPÅ TasksProvider, fordi TasksProvider bruker
    // useAuth() for å få tokenet.
    <AuthProvider>
      <TasksProvider>
        <RootNavigator />
      </TasksProvider>
    </AuthProvider>
  );
}
