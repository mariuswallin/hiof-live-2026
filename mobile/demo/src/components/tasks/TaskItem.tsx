import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";
import type { Task } from "@/utils/task-schema";
import { View, Text, StyleSheet, Pressable } from "react-native";

type TaskItemProps = {
  task: Task;
  onToggle: (id: string) => void;
};

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const { id, title, done } = task;
  const { tasks, toggle } = useTasks();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        task.done && styles.containerDone,
        pressed && styles.containerPressed,
      ]}
      onPress={() => toggle(id)}
    >
      <View style={[styles.checkbox, done && styles.checkboxDone]}>
        {done ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text>{tasks.length}</Text>
      <Text style={[styles.title, done && styles.titleDone]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.surface,
  },
  containerDone: {
    backgroundColor: Theme.primaryLight,
    borderColor: Theme.primary,
  },
  containerPressed: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Theme.border,
    borderRadius: Theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    borderColor: Theme.success,
    backgroundColor: Theme.success,
  },
  checkmark: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.sm,
    fontWeight: "700",
  },
  title: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Theme.text,
  },
  titleDone: {
    color: Theme.muted,
    textDecorationLine: "line-through",
  },
});
