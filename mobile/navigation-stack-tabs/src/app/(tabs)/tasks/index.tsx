import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { TaskList } from "@/components/tasks/TaskList";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";

/**
 * "/tasks" - lista. Samme oppsett som index.tsx i demo-appen:
 *   const { tasks, toggle } = useTasks();
 *   <TaskList tasks={tasks} onToggle={toggle} />
 *
 * Nytt her: hver rad er en <Link> til detaljsiden (se TaskItem.tsx), og
 * "ny oppgave" er flyttet til en egen skjerm som åpnes med + i headeren.
 *
 * Lista er hentet fra API-et (listTodos) i TasksContext, med use() +
 * Suspense. Derfor ingen laster- eller feil-tilstand HER: rendres skjermen,
 * er lista klar. (Sammenlign med users/index.tsx, som må sjekke selv.)
 */
export default function TasksScreen() {
  const { tasks, toggle } = useTasks();

  return (
    <>
      {/*
        En skjerm kan justere SIN EGEN header ved å rendre <Stack.Screen>.
        Her legger vi til en "+"-knapp som åpner skjemaet.
        href="/new-task" - skjemaet ligger i rot-Stacken, men det trenger vi
        ikke tenke på: Link finner veien uansett hvor i treet ruten bor.
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

      <TaskList tasks={tasks} onToggle={toggle} />
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    fontSize: Theme.fontSize.xl,
    color: Theme.primary,
    paddingHorizontal: Theme.spacing.sm,
  },
});
