import { Theme } from "@/constants/theme";
import { Stack } from "expo-router";

export default function StudentsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.danger,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Studenter",
        }}
      />
      <Stack.Screen
        name="[studentId]"
        options={{
          title: "Bruker",
        }}
      />
    </Stack>
  );
}
