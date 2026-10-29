import { Theme } from "@/constants/theme";
import { Stack } from "expo-router";

export default function TasksStackLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: Theme.primary }}>
      <Stack.Screen name="index" options={{ title: "Oppgaver" }} />
      <Stack.Screen name="[id]" options={{ title: "Oppgave" }} />
    </Stack>
  );
}
