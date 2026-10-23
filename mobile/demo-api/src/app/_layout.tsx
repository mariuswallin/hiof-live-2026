// STEG 2: rot-Stacken får (tabs) og new-task.
// HER -> (tabs)/_layout.tsx (tab-bar) -> (tabs)/tasks/_layout.tsx (Stack i tab)
// HER -> new-task.tsx (oppå tab-baren)

import { Loading } from "@/components/shared/Loading";
import { Theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { Stack } from "expo-router";
import { View } from "react-native";

/**
 * STEG 2: åpnes en skjerm utenfor tabs DIREKTE (dyplenke), f.eks. /about,
 * ville rot-Stacken bare inneholdt den - og ingen vei "tilbake".
 * Ankeret legger (tabs) under, så tilbake ender på Hjem.
 *
 * STEG FIKS: `anchor` er også skjermen Stacken starter på når den ikke har en
 * URL å gå etter (mobil). Før stod det `initialRouteName` - samme virkning,
 * men utgått i SDK 57.
 */
export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <View>
        <Loading />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.primary,
      }}
    >
      {/*
        STEG 2: tab-baren. Tabs tegner sine egne headere - skjul rot-Stackens,
        ellers får vi to headere oppå hverandre.
      */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/*
        STEG 2: skjemaet. Alt som ligger her i rot-Stacken, UTENFOR (tabs),
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
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="admin" options={{ title: "Admin" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TasksProvider>
        <RootNavigator />
      </TasksProvider>
    </AuthProvider>
  );
}
