import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TaskRegister } from "@/components/task-register";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/context/tasks-context";
import { NewTaskSchema } from "@/utils/task-schema";

/**
 * "/new-task" - MODAL.
 *
 * Det er ikke fila som gjør den til en modal, men options i rot-_layout.tsx:
 *   <Stack.Screen name="new-task" options={{ presentation: "modal" }} />
 *
 * Fordi den ligger i ROT-Stacken, dekker den både tab-baren og skuffen.
 *
 * Skjemaet er TaskRegister fra hiof-live-2026, uendret i bruk: den gir oss
 * tittelen via onRegister. Forskjellen fra før er HVA vi gjør etterpå:
 * i stedet for å bli stående, lukker vi modalen med router.back().
 */
export default function NewTaskModal() {
  const { add } = useTasks();
  const [error, setError] = useState("");

  function handleRegisterTask(taskName: string) {
    // Samme zod-regel som Task-skjemaet (minst 3 tegn, trimmet).
    const result = NewTaskSchema.safeParse({ title: taskName });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Ugyldig tittel");
      return;
    }

    add(result.data.title);
    // Lukk modalen. Lista under er allerede oppdatert via context.
    router.back();
  }

  return (
    <View style={styles.container}>
      <TaskRegister onRegister={handleRegisterTask} error={error} />

      {/* På Android finnes ingen "dra ned for å lukke" - gi en egen knapp. */}
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
