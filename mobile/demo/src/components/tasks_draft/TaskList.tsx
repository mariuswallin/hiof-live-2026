import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";

import { TaskItem } from "@/components/tasks_draft/TaskItem";
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

  // Den enkleste varianten: .map(). Se src/components/list_draft for de
  // andre måtene (ScrollView, FlatList, FlashList) og når de lønner seg.
  //
  // Fragment brukes fordi hver runde gir TO elementer (skillelinje + rad),
  // og JSX bare tillater én rot per iterasjon. `key` hører hjemme på
  // Fragment-en - altså på det ytterste elementet - ikke på TaskItem.
  return (
    <View style={styles.container}>
      {tasks.map((task, index) => (
        <Fragment key={task.id}>
          {index > 0 ? <View style={styles.separator} /> : null}
          <TaskItem task={task} onToggle={onToggle} />
        </Fragment>
      ))}
    </View>
  );
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
