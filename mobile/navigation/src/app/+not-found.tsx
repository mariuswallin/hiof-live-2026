import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { Empty } from "@/components/empty";
import { Screen } from "@/components/screen";
import { Theme } from "@/constants/theme";

/**
 * +not-found = vises når URL-en ikke matcher noen fil.
 *
 * Test (med `pnpm start` kjørende):
 * - Web:              http://localhost:8081/finnes-ikke
 * - iOS simulator:    npx uri-scheme open "exp://127.0.0.1:8081/--/finnes-ikke" --ios
 * - Android emulator: npx uri-scheme open "exp://10.0.2.2:8081/--/finnes-ikke" --android
 *
 * I Expo Go er det exp://-adressen som gjelder. Vårt eget skjema
 * (navigation://finnes-ikke, fra "scheme" i app.json) virker først i en
 * development build (npx expo run:ios) eller i en ferdig app.
 */
export default function NotFoundScreen() {
  return (
    <Screen>
      <Empty title="Siden finnes ikke" />
      <Link href="/" style={styles.link}>
        Til forsiden
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: {
    textAlign: "center",
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Theme.primary,
  },
});
