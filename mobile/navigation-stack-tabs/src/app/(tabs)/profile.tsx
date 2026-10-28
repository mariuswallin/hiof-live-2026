import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
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
  const { user, isAdmin, login, logout } = useAuth();
  const [error, setError] = useState("");

  // Kontobytte = logg inn som den ANDRE brukeren i webappen.
  // 1 = Kari Nordmann (admin), 2 = Ola Hansen (user) - se login.tsx.
  async function switchAccount() {
    try {
      setError("");
      await login(isAdmin ? 2 : 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kunne ikke logge inn");
    }
  }

  // Stack.Protected i rot-_layout.tsx viser bare appen når noen er innlogget,
  // så her finnes brukeren alltid. Men typen er User | null, så TypeScript
  // krever sjekken.
  if (!user) return null;

  return (
    <Screen>
      <Card title={user.name}>
        <View style={styles.row}>
          {/*
            Webappen har ikke profilbilder. dummyjson lager et ikon av hvilken
            som helst tekst - her navnet.
          */}
          <Image
            source={`https://dummyjson.com/icon/${encodeURIComponent(user.name)}/128`}
            style={styles.avatar}
          />
          <View style={styles.info}>
            <Text style={styles.muted}>{user.email}</Text>
            {/* Rollen kom fra webappen sammen med resten av brukeren. */}
            <Text style={styles.muted}>Rolle: {user.role}</Text>
          </View>
        </View>

        {/*
          Glemmer tokenet: user blir null, og Stack.Protected sender deg til
          /login. Samme som skjer ved en refresh (F5 / "r" i Metro).
        */}
        <Button label="Logg ut" onPress={logout} />
      </Card>

      <Card title="Bytt konto">
        <Text style={styles.muted}>
          Som admin dukker det opp en lenke til /admin på Hjem, og du ser alle
          oppgavene. Som vanlig bruker ser du bare dine egne, og /admin finnes
          ikke i det hele tatt.
        </Text>
        <Button
          label={
            isAdmin
              ? "Logg inn som Ola Hansen (user)"
              : "Logg inn som Kari Nordmann (admin)"
          }
          onPress={switchAccount}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      {/*
        Skjermene utenfor tabs nås med vanlige lenker. De ligger i
        rot-Stacken, så de legges oppå tab-baren og får tilbake-knapp.
      */}
      <Card title="Snarveier">
        <Link href="/settings" style={styles.link}>
          Innstillinger →
        </Link>
        <Link href="/about" style={styles.link}>
          Om appen →
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
  error: {
    fontSize: Theme.fontSize.md,
    color: Theme.danger,
  },
  link: {
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Theme.primary,
  },
});
