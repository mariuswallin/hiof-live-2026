import { StyleSheet, View } from "react-native";

import { TaskItem } from "@/components/tasks_draft/TaskItem";
import { Theme } from "@/constants/theme";
import type { Task } from "@/utils_draft/task-schema";

type MapListProps = {
  tasks: Task[];
  onToggle?: (id: string) => void;
};

/**
 * 1) .map() - den enkleste lista.
 *
 * Rendrer ALLE elementene med én gang, og scroller ikke.
 * `key` må være unik og stabil - React bruker den til å vite hvilket element
 * som er hvilket når lista endrer seg. Bruk aldri array-indeks som key hvis
 * lista kan sorteres eller filtreres.
 *
 * Bruk når: få og korte lister (meny, tabs, 5-20 elementer).
 * Ikke bruk når: lista kan bli lang - da rendres alt, hver gang.
 */
export function MapList({ tasks, onToggle }: MapListProps) {
  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
  },
});
