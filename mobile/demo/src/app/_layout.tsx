import { Loading } from "@/components/shared/Loading";
import { Theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { Stack } from "expo-router";
import { View } from "react-native";

export const unstable_settings = {
  anchor: "index",
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
      <Stack.Screen name="index" />
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
