import { Link, Stack } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Empty } from "@/components/empty";
import { TaskItem } from "@/components/task-item";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/context/tasks-context";

/**
 * "/tasks" - lista. Samme FlatList som i demo-appen.
 *
 * Nytt her: ingen props! Skjermen henter data fra context, og hver rad er
 * en <Link> til detaljsiden (se components/task-item.tsx).
 */
export default function TasksScreen() {
  const { tasks, toggle } = useTasks();

  return (
    <>
      {/*
        En skjerm kan justere SIN EGEN header ved å rendre <Stack.Screen>.
        Her legger vi til en "+"-knapp som åpner modalen.
        href="/new-task" - modalen ligger i rot-Stacken, men det trenger vi
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

      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        renderItem={({ item }) => <TaskItem task={item} onToggle={toggle} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Empty title="Ingen oppgaver" hint="Trykk + for å legge til." />
        }
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Theme.spacing.lg,
  },
  separator: {
    height: Theme.spacing.sm,
  },
  headerButton: {
    fontSize: Theme.fontSize.xl,
    color: Theme.primary,
    paddingHorizontal: Theme.spacing.sm,
  },
});
