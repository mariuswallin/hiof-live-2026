import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TaskRegister } from "@/components/tasks/TaskRegister";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";
import { NewTaskSchema } from "@/utils/task-schema";

/**
 * "/new-task" - skjema for ny oppgave, som en vanlig STACK-skjerm.
 *
 * Det er plasseringen som avgjør hvordan den vises, ikke fila. Den ligger i
 * ROT-Stacken (registrert i rot-_layout.tsx), UTENFOR (tabs):
 *   <Stack.Screen name="new-task" options={{ title: "Ny oppgave" }} />
 *
 * Derfor legges den oppå tab-baren, og får header med tilbake-knapp.
 * Hadde fila ligget i (tabs)/tasks/, ville tab-baren blitt stående.
 *
 * Skjemaet er TaskRegister fra hiof-live-2026, uendret i bruk: den gir oss
 * tittelen via onRegister. Forskjellen fra før er HVA vi gjør etterpå:
 * i stedet for å bli stående, går vi tilbake med router.back().
 *
 * Oppgaven LAGRES i webappen med addApi() (POST /api/v1/tasks). Bytt til
 * add() for å se forskjellen: da er den borte etter en refresh.
 */
export default function NewTaskScreen() {
  const { addApi } = useTasks();
  const [error, setError] = useState("");

  async function handleRegisterTask(taskName: string) {
    // Samme zod-regel som Task-skjemaet (minst 3 tegn, trimmet). Sjekkes HER
    // først, så vi slipper en tur til serveren for noe vi vet er feil.
    const result = NewTaskSchema.safeParse({ title: taskName });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Ugyldig tittel");
      return;
    }

    try {
      // result.data = { title, done: false }. await: vent til serveren har
      // svart 201 - først da finnes oppgaven (med id fra serveren).
      await addApi(result.data);
      // Fjern skjemaet fra Stacken. Lista under er allerede oppdatert via context.
      router.back();
    } catch (error) {
      // Webappen svarte 400, eller kjører ikke ("Network request failed").
      // Vi blir stående, så brukeren ser feilen og kan prøve igjen.
      setError(error instanceof Error ? error.message : "Kunne ikke lagre");
    }
  }

  return (
    <View style={styles.container}>
      <TaskRegister onRegister={handleRegisterTask} error={error} />

      {/*
        Tilbake-knappen i headeren gjør det samme. Men i et skjema er en
        tydelig "Avbryt" vanlig - brukeren ser at ingenting blir lagret.
      */}
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.cancel}>Avbryt</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  cancel: {
    textAlign: "center",
    padding: Theme.spacing.md,
    color: Theme.primary,
    fontSize: Theme.fontSize.md,
  },
});
