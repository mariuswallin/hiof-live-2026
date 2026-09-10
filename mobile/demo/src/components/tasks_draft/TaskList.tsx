import { StyleSheet, Text, View } from "react-native";

import { Theme } from "@/constants/theme";
import type { Task } from "@/utils_draft/task-schema";

/**
 * Props:
 * - tasks:      dataene som skal vises. Alltid en array - aldri undefined,
 *               da slipper vi null-sjekker nedover.
 * - onToggle:   sendes VIDERE ned til hver TaskItem. TaskList bruker den ikke
 *               selv, den bare formidler. (Kalles ofte "prop drilling".)
 * - emptyLabel: tekst når lista er tom. Default-verdi settes i destrukturering.
 */
type TaskListProps = {
  tasks: Task[];
  onToggle?: (id: string) => void;
  emptyLabel?: string;
};

export function TaskList({
  tasks,
  onToggle,
  emptyLabel = "Ingen oppgaver ennå",
}: TaskListProps) {
  // Tom-tilstand først: enklere å lese enn en if inne i JSX-en.
  if (tasks.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  // TODO (demo): render tasks - se src/components/lists for de ulike måtene
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    // gap gir avstand MELLOM elementene, uten margin på hvert enkelt.
    gap: Theme.spacing.sm,
    width: "100%",
  },
  // Brukes som contentContainerStyle på FlatList/FlashList/ScrollView
  content: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.border,
  },
  empty: {
    padding: Theme.spacing.xl,
    textAlign: "center",
    color: Theme.muted,
    fontSize: Theme.fontSize.md,
  },
});
