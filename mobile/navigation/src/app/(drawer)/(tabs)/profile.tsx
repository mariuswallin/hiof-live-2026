import { Image } from "expo-image";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
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
  const { user, isAdmin, reload, loginAs } = useAuth();

  // Rot-_layout.tsx viser ikke appen før brukeren er hentet, så her finnes
  // den alltid. Men typen er AuthUser | null, så TypeScript krever sjekken.
  if (!user) return null;

  return (
    <Screen>
      <Card title={`${user.firstName} ${user.lastName}`}>
        <View style={styles.row}>
          <Image source={user.image} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.muted}>{user.email}</Text>
            {/* Rollen kom fra API-et sammen med resten av brukeren. */}
            <Text style={styles.muted}>Rolle: {user.role}</Text>
          </View>
        </View>

        {/*
          Simulerer en refresh: user settes til null og hentes på nytt.
          Sammenlign med en ekte refresh (F5 / "r" i Metro) - samme flyt.
        */}
        <Button label="Hent bruker på nytt" onPress={reload} />
      </Card>

      <Card title="Bytt konto (simulert innlogging)">
        <Text style={styles.muted}>
          Som admin dukker det opp en lenke til /admin på Hjem. Som vanlig
          bruker finnes ikke ruten i det hele tatt.
        </Text>
        <Button
          label={isAdmin ? "Logg inn som vanlig bruker" : "Logg inn som admin"}
          onPress={() => loginAs(isAdmin ? "user" : "admin")}
        />
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
});
