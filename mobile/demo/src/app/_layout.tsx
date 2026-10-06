import { TasksProvider } from "@/contexts/TasksContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <TasksProvider>
      <Stack />
    </TasksProvider>
  );
}
