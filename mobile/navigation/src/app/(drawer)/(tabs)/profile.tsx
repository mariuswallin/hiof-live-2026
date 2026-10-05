import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Theme } from "@/constants/theme";

/**
 * "/profile" - en helt vanlig tab uten egen Stack.
 * Trenger ikke taben flere nivåer, holder det med én fil.
 */
export default function ProfileScreen() {
  return (
    <Screen>
      <Card title="Ola Nordmann">
        <Text style={styles.muted}>Student, HiOF</Text>
      </Card>

      <Card title="Snarveier">
        <Link href="/settings" style={styles.link}>
          Innstillinger →
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: Theme.fontSize.md,
    color: Theme.muted,
  },
  link: {
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Theme.primary,
  },
});
