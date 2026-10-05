import { Stack } from "expo-router";

export default function RootLayout() {
  // TaskLayout tegner sin egen header, så vi slår av navigatorens header for
  // å slippe to overskrifter oppå hverandre.
  //
  // CONTEXT: skal flere skjermer dele oppgavene, pakk navigatoren inn i
  // provideren, så når ALLE skjermer useTasks():
  //
  //   return (
  //     <TasksProvider>
  //       <Stack screenOptions={{ headerShown: false }} />
  //     </TasksProvider>
  //   );
  //
  // (import { TasksProvider } from "@/context_draft/TasksContext";)
  return <Stack screenOptions={{ headerShown: false }} />;
}
