import { FlatList, StyleSheet, Text, View } from "react-native";

import { TaskItem } from "@/components/tasks_draft/TaskItem";
import { Theme } from "@/constants/theme";
import type { Task } from "@/utils_draft/task-schema";

type FlatListTasksProps = {
  tasks: Task[];
  onToggle?: (id: string) => void;
  /**
   * Sett true når lista ligger INNE i en ScrollView.
   * To scroll-flater oppå hverandre gir hakkete scrolling, så da lar vi
   * ScrollView scrolle og FlatList bare rendre. (Da mister vi også
   * virtualiseringen - så helst: unngå liste-i-scrollview.)
   */
  insideScrollView?: boolean;
};

/**
 * 3) FlatList - React Natives innebygde, virtualiserte liste.
 *
 * Virtualisering = bare det som er synlig (+ litt til) finnes i minnet.
 * Derfor: ikke .map() inni, du gir den `data` og en `renderItem`.
 *
 * Sentrale props:
 * - data              hva som skal vises
 * - renderItem        hvordan ETT element ser ut ({ item, index })
 * - keyExtractor      unik id per element (samme rolle som `key` i .map())
 * - ItemSeparatorComponent  vises MELLOM elementene, ikke først/sist
 * - ListEmptyComponent      vises når data er tom
 * - contentContainerStyle   padding/gap på innholdet
 * - keyboardDismissMode / keyboardShouldPersistTaps
 *                           ScrollView-props som FlatList sender videre.
 *                           Se ScrollViewList for forklaring.
 */
export function FlatListTasks({
  tasks,
  onToggle,
  insideScrollView = false,
}: FlatListTasksProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(task) => task.id}
      renderItem={({ item }) => <TaskItem task={item} onToggle={onToggle} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.empty}>Ingen oppgaver</Text>}
      contentContainerStyle={styles.content}
      scrollEnabled={!insideScrollView}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
  },
  separator: {
    height: Theme.spacing.xs,
  },
  empty: {
    padding: Theme.spacing.xl,
    textAlign: "center",
    color: Theme.muted,
  },
});
