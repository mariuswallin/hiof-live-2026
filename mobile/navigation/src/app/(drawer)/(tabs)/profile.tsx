import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/shared/Card";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

/**
 * "/profile" - en helt vanlig tab uten egen Stack.
 * Trenger ikke taben flere nivåer, holder det med én fil.
 *
 * Brukeren kommer fra AuthContext - skjermen henter INGENTING selv.
 * Bytt tab og kom tilbake: brukeren er der med en gang, uten ny henting.
 */
export default function ProfileScreen() {
  const { user, reload } = useAuth();

  // Rett etter oppstart/refresh er user null til API-svaret kommer.
  // Hver skjerm som bruker useAuth() må tåle det.
  if (!user) {
    return (
      <Screen>
        <Loading label="Henter bruker ..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card title={`${user.firstName} ${user.lastName}`}>
        <View style={styles.row}>
          <Image source={user.image} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.muted}>{user.email}</Text>
            <Text style={styles.muted}>Student, HiOF</Text>
          </View>
        </View>

        {/*
          Simulerer en refresh: user settes til null og hentes på nytt.
          Sammenlign med en ekte refresh (F5 / "r" i Metro) - samme flyt.
        */}
        <Pressable
          onPress={reload}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Hent bruker på nytt</Text>
        </Pressable>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.primaryLight,
  },
  info: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  muted: {
    fontSize: Theme.fontSize.md,
    color: Theme.muted,
  },
  link: {
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Theme.primary,
  },
  button: {
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.primary,
  },
  pressed: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.md,
    fontWeight: "700",
  },
});
