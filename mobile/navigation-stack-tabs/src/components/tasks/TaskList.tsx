import { FlatList, StyleSheet, View } from "react-native";

import { Empty } from "@/components/shared/Empty";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Theme } from "@/constants/theme";
import type { Task } from "@/utils/task-schema";

type TaskListProps = {
  tasks: Task[];
  onToggle: (id: string) => void;
};

/**
 * Samme TaskList som i demo-appen: får tasks + onToggle som props og
 * rendrer én TaskItem per oppgave. To endringer:
 *
 * - TaskRegister er IKKE lenger her. Skjemaet har fått sin egen skjerm
 *   (new-task.tsx), og lista har bare én jobb: vise oppgavene.
 * - FlatList i stedet for tasks.map(...). Lista fyller nå hele skjermen og
 *   må kunne scrolle - FlatList scroller selv og rendrer bare radene som
 *   er synlige.
 */
export function TaskList({ tasks, onToggle }: TaskListProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(task) => task.id}
      renderItem={({ item }) => <TaskItem task={item} onToggle={onToggle} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      // Erstatter if (tasks.length === 0) { ... } fra demoen.
      ListEmptyComponent={
        <Empty title="Ingen oppgaver" hint="Trykk + for å legge til." />
      }
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Theme.spacing.lg,
  },
  separator: {
    height: Theme.spacing.sm,
  },
});
