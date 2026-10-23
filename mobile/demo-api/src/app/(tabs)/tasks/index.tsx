// STEG 2: NY - lista fra gamle app/index.tsx (STEG 0 og 1 er flyttet hit).
// contexts/TasksContext.tsx -> HER -> TaskList.tsx -> TaskItem.tsx (Link til [id].tsx)
// "+" i headeren -> new-task.tsx

import { Link, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Loading } from "@/components/shared/Loading";
import { TaskList } from "@/components/tasks/TaskList";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";

/**
 * STEG 2: "/tasks" - lista. Samme kode som i gamle app/index.tsx, minus:
 * - skjemaet (TaskRegister): nå egen skjerm, new-task.tsx
 * - TaskLayout: navigatoren tegner headeren nå
 */
export default function TasksScreen() {
  // STEG 0: isLoading og error fra hentingen. STEG 1: toggleApi og removeApi.
  const { tasks, toggleApi, removeApi, isLoading, error } = useTasks();
  // STEG 0: feil fra LAGRING. `error` over er feil fra HENTINGEN av lista.
  const [saveError, setSaveError] = useState("");

  // STEG 1: uendret fra gamle app/index.tsx.
  async function handleToggle(id: string) {
    try {
      await toggleApi(id);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Kunne ikke lagre");
    }
  }

  // STEG 1: uendret fra gamle app/index.tsx.
  async function handleRemove(id: string) {
    try {
      // Optimistisk: oppgaven er allerede borte fra lista mens vi venter her.
      await removeApi(id);
      setSaveError("");
    } catch (error) {
      // Serveren sa nei - removeApi har lagt oppgaven tilbake i lista.
      setSaveError(error instanceof Error ? error.message : "Kunne ikke slette");
    }
  }

  return (
    // STEG 2: ScrollView - lista kan bli lengre enn skjermen.
    <ScrollView contentContainerStyle={styles.container}>
      {/*
        STEG 2: en skjerm kan justere SIN EGEN header ved å rendre
        <Stack.Screen>. "+" åpner skjemaet. new-task.tsx ligger i rot-Stacken,
        men Link finner veien uansett hvor i treet ruten bor.
      */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/new-task" asChild>
              <Pressable hitSlop={8} accessibilityLabel="Ny oppgave">
                <Text style={styles.headerButton}>＋</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      {/* STEG 0: feil ved henting, og feil ved lagring. */}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      {/*
        STEG 0: laster ELLER lista - aldri begge. Mens vi venter er lista tom,
        og da ville TaskList vist "No tasks available" ved siden av spinneren.
        STEG 2: ingen onRegister lenger - skjemaet bor i new-task.tsx.
      */}
      {isLoading ? (
        <Loading label="Henter oppgaver fra webappen ..." />
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onRemove={handleRemove}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  headerButton: {
    fontSize: Theme.fontSize.xl,
    color: Theme.primary,
    paddingHorizontal: Theme.spacing.sm,
  },
  error: {
    color: Theme.danger,
    paddingVertical: 4,
  },
});
