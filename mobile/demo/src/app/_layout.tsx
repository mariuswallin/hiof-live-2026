import { Theme } from "@/constants/theme";
import { TasksProvider } from "@/contexts/TasksContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <TasksProvider>
      <Stack
        screenOptions={{
          headerTintColor: Theme.primary,
        }}
      >
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
      </Stack>
    </TasksProvider>
  );
}
