import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

import type { Task } from "@/utils/task-schema";
import { Link } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";

type TaskItemProps = {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  const { id, title, done } = task;
  const { isAdmin } = useAuth();

  return (
    <View style={[styles.container, done && styles.containerDone]}>
      <Pressable onPress={() => onToggle(id)} style={styles.toggle}>
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={[styles.title, done && styles.titleDone]}>{title}</Text>
      </Pressable>
      {/* <Text>{tasks.length}</Text> */}
      <Link href={{ pathname: "/tasks/[id]", params: { id } }}>Gå til</Link>
      {isAdmin ? (
        <Pressable onPress={() => onRemove(id)} hitSlop={8}>
          <Text style={styles.remove}>Slett</Text>
        </Pressable>
      ) : null}
    </View>
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
  // Checkbox + tittel på rad, og flex: 1 skyver Slett helt til høyre.
  toggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
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
    color: Theme.textDark,
  },
  titleDone: {
    color: Theme.muted,
    textDecorationLine: "line-through",
  },
  // STEG 1: Slett-knappen.
  remove: {
    color: Theme.danger,
    fontSize: Theme.fontSize.sm,
    fontWeight: "600",
  },
});
