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
 * Tastatur (gjelder alle scroll-listene - FlatList og FlashList arver propene):
 * - keyboardDismissMode="on-drag"         lukk tastaturet når brukeren begynner
 *                                         å scrolle. Standard er "none".
 * - keyboardShouldPersistTaps="handled"   et trykk på en rad virker med én gang
 *                                         mens tastaturet er oppe. Standard er
 *                                         "never": første trykk lukker bare
 *                                         tastaturet, og raden får det ikke.
 *
 * Bruk når: innholdet er blandet (tekst, bilder, skjema) og av begrenset lengde.
 */
export function ScrollViewList({ tasks, onToggle }: ScrollViewListProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
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
