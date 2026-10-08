import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
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
 */
export default function TasksScreen() {
  // isLoading/error kommer fra hentingen i TasksContext (useEffect).
  const { tasks, toggle, isLoading, error } = useTasks();

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

      {/* Tre tilstander: laster -> feil -> data. TaskList får bare data. */}
      {isLoading ? (
        <Screen>
          <Loading label="Henter oppgaver ..." />
        </Screen>
      ) : error ? (
        <Screen>
          <Empty title="Klarte ikke å hente oppgaver" hint={error} />
        </Screen>
      ) : (
        <TaskList tasks={tasks} onToggle={toggle} />
      )}
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
