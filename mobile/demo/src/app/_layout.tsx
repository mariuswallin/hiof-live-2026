import { Theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { Stack } from "expo-router";

export const unstable_settings = {
  anchor: "index",
};

function RootNavigator() {
  const { user, isAdmin } = useAuth();

  // Samme idé som requireUserPage i webappen: uten bruker finnes bare login.
  // Når user settes eller fjernes, bytter Stack.Protected skjerm selv.

  const validUser = user !== null && user !== undefined;

  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.primary,
      }}
    >
      <Stack.Protected guard={!validUser}>
        <Stack.Screen name="login" options={{ title: "Logg inn" }} />
      </Stack.Protected>

      <Stack.Protected guard={validUser}>
        <Stack.Screen name="index" />
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
