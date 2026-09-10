import { Stack } from "expo-router";

export default function RootLayout() {
  // TaskLayout tegner sin egen header, så vi slår av navigatorens header for
  // å slippe to overskrifter oppå hverandre.
  return <Stack screenOptions={{ headerShown: false }} />;
}
