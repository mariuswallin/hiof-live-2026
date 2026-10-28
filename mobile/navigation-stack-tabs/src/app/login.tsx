import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

/**
 * "/login" - finnes bare når INGEN er innlogget (Stack.Protected i
 * rot-_layout.tsx).
 *
 * Ingen router.replace("/") etter innloggingen. login() setter brukeren i
 * AuthContext, og da blir guard false for denne skjermen og true for resten.
 * Stack.Protected sender oss inn i appen selv.
 */

// USIKKERT: ingen passord, du er den du trykker på. Alternativ: e-post og
// passord som serveren sjekker, og som gir tilbake et token.
// id-ene er brukerne i webappens seed (webapp/tasks/src/db/seed.ts).
const USERS = [
  { id: 1, label: "Kari Nordmann (admin)" },
  { id: 2, label: "Ola Hansen (user)" },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [error, setError] = useState("");

  async function handleLogin(userId: number) {
    try {
      setError("");
      await login(userId);
    } catch (error) {
      // Webappen svarte 400 (ukjent bruker), eller kjører ikke
      // ("Network request failed"). Vi blir stående, så brukeren ser feilen.
      setError(error instanceof Error ? error.message : "Kunne ikke logge inn");
    }
  }

  return (
    <Screen>
      <Card title="Hvem er du?">
        <Text style={styles.text}>
          Jukseinnlogging. Velg hvem du er, uten passord.
        </Text>
        {USERS.map((user) => (
          <Button
            key={user.id}
            label={user.label}
            onPress={() => handleLogin(user.id)}
          />
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: Theme.fontSize.md,
    color: Theme.text,
  },
  error: {
    fontSize: Theme.fontSize.md,
    color: Theme.danger,
  },
});
