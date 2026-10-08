import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Theme } from "@/constants/theme";

type TaskRegisterProps = {
  onRegister: (taskName: string) => void;
  /** Feilmelding fra forelderen. Tom/undefined = ingen feil. */
  error?: string;
};

/**
 * Samme TaskRegister som i hiof-live-2026: kontrollert TextInput med
 * useState, "Du skrev ...", og en knapp som sender tittelen opp via
 * onRegister.
 *
 * Eneste tillegg er `error`-propen, så forelderen (new-task.tsx) kan vise
 * valideringsfeil. Komponenten vet fortsatt ikke noe om navigasjon - den
 * sier bare ifra. Det er skjermen som bestemmer å gå tilbake etterpå.
 */
export function TaskRegister({ onRegister, error }: TaskRegisterProps) {
  const [title, setTitle] = useState("");

  function onTextUpdate(text: string) {
    setTitle(text);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Register</Text>
      <Text>Du skrev {title}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder="Enter task name"
        value={title}
        onChangeText={onTextUpdate}
        onSubmitEditing={() => onRegister(title)}
        returnKeyType="done"
        autoFocus
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={() => onRegister(title)}>
        <Text style={styles.buttonText}>Register Task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.background,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: "bold",
    color: Theme.text,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 8,
  },
  inputError: {
    borderColor: Theme.danger,
  },
  error: {
    fontSize: Theme.fontSize.sm,
    color: Theme.danger,
  },
  button: {
    backgroundColor: Theme.primary,
    padding: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
