import { ScrollView, StyleSheet } from "react-native";

import { TaskItem } from "@/components/tasks_draft/TaskItem";
import { Theme } from "@/constants/theme";
import type { Task } from "@/utils_draft/task-schema";

type ScrollViewListProps = {
  tasks: Task[];
  onToggle?: (id: string) => void;
};

/**
 * 2) ScrollView + .map() - samme som MapList, men kan scrolles.
 *
 * Viktig: ScrollView rendrer ALT innhold med én gang, også det som er
 * utenfor skjermen. 1000 elementer = 1000 komponenter i minnet.
 *
 * Merk forskjellen på de to style-propene:
 * - style          = selve scroll-boksen (må ha høyde, derfor flex: 1)
 * - contentContainerStyle = innholdet SOM scroller (padding og gap hører hit)
 *
 * Bruk når: innholdet er blandet (tekst, bilder, skjema) og av begrenset lengde.
 */
export function ScrollViewList({ tasks, onToggle }: ScrollViewListProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
  },
});
