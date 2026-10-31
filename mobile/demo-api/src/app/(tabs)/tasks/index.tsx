// STEG 2B: NY - lista fra gamle app/index.tsx (steg 0 og 1 er flyttet hit).
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
 * STEG 2B: "/tasks" - lista. Samme kode som i gamle app/index.tsx, minus:
 * - skjemaet (TaskRegister): nå egen skjerm, new-task.tsx
 * - TaskLayout: navigatoren tegner headeren nå
 */
export default function TasksScreen() {
  const { tasks, toggleApi, removeApi, isLoading, error } = useTasks();
  // Feil fra LAGRING. `error` over er feil fra HENTINGEN av lista.
  const [saveError, setSaveError] = useState("");

  // Uendret fra gamle app/index.tsx.
  async function handleToggle(id: string) {
    try {
      await toggleApi(id);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Kunne ikke lagre");
    }
  }

  // Uendret fra gamle app/index.tsx.
  async function handleRemove(id: string) {
    try {
      // Optimistisk: oppgaven er allerede borte fra lista mens vi venter her.
      await removeApi(id);
      setSaveError("");
    } catch (error) {
      // Serveren sa nei - removeApi har lagt oppgaven tilbake i lista.
      // STEG 2A: som Ola er det alltid nei: "Bare admin har lov til dette".
      setSaveError(error instanceof Error ? error.message : "Kunne ikke slette");
    }
  }

  return (
    // STEG 2B: ScrollView - lista kan bli lengre enn skjermen.
    <ScrollView contentContainerStyle={styles.container}>
      {/*
        STEG 2B: en skjerm kan justere SIN EGEN header ved å rendre
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

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      {/*
        STEG 2B: laster ELLER lista - aldri begge. Mens vi venter er lista tom,
        og da ville TaskList vist "No tasks available" ved siden av spinneren.
        Ingen onRegister lenger - skjemaet bor i new-task.tsx.
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
