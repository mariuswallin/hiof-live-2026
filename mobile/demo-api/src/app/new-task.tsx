// STEG 2B: skjemaet, flyttet ut av TaskList.tsx. Registrert i rot-Stacken
// (app/_layout.tsx), UTENFOR (tabs), så den legges OPPÅ tab-baren.
// TaskRegister.tsx -> HER (handleRegister) -> contexts/TasksContext.tsx (addApi)

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TaskRegister } from "@/components/tasks/TaskRegister";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";

/**
 * STEG 2B: "/new-task" - skjema for ny oppgave, som egen Stack-skjerm.
 *
 * Det er PLASSERINGEN som avgjør hvordan den vises: den ligger i rot-Stacken,
 * og alt der legges oppå (tabs). Hadde fila ligget i (tabs)/tasks/, ville
 * tab-baren blitt stående.
 */
export default function NewTaskScreen() {
  const { addApi } = useTasks();
  // STEG 2B: før ble feilen svelget ("Håndtere feil og sørge for at det vises
  // frem"). Nå havner den her og vises under skjemaet.
  const [saveError, setSaveError] = useState("");

  async function handleRegister(taskName: string) {
    try {
      // await: vent til serveren har svart 201 før vi går videre.
      await addApi({ title: taskName, done: false });
      // router = navigasjon fra KODE. back() fjerner skjemaet fra Stacken.
      // Lista under er allerede oppdatert via context.
      router.back();
    } catch (error) {
      // Webappen svarte 400 (f.eks. tom tittel), eller kjører ikke. Vi blir
      // stående, så brukeren ser feilen og kan prøve igjen.
      setSaveError(error instanceof Error ? error.message : "Kunne ikke lagre");
    }
  }

  return (
    <View style={styles.container}>
      <TaskRegister onRegister={handleRegister} />
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      {/* Tilbake-knappen i headeren gjør det samme - men i et skjema er en
          tydelig "Avbryt" vanlig. */}
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
  error: {
    color: Theme.danger,
    paddingHorizontal: Theme.spacing.lg,
  },
  cancel: {
    textAlign: "center",
    padding: Theme.spacing.md,
    color: Theme.primary,
    fontSize: Theme.fontSize.md,
  },
});
