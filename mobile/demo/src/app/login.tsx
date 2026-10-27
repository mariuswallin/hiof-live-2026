import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// USIKKERT: ingen passord, du er den du trykker på. Alternativ: e-post og
// passord som serveren sjekker, og som gir tilbake et token.
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
      setError(error instanceof Error ? error.message : "Kunne ikke logge inn");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Jukseinnlogging. Velg hvem du er, uten passord.
      </Text>
      {USERS.map((user) => (
        <Pressable
          key={user.id}
          onPress={() => handleLogin(user.id)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{user.label}</Text>
        </Pressable>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Theme.spacing.md,
    padding: Theme.spacing.lg,
  },
  text: {
    fontSize: Theme.fontSize.md,
    color: Theme.text,
  },
  button: {
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.primary,
  },
  buttonText: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
  },
  error: {
    color: Theme.danger,
  },
});
