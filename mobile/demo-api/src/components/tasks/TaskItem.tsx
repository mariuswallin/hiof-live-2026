// STEG 2B: (tabs)/tasks/index.tsx -> TaskList.tsx -> HER -> Link til (tabs)/tasks/[id].tsx

import { Theme } from "@/constants/theme";
import type { Task } from "@/utils/task-schema";
// STEG 2B: Link, for å gjøre tittelen til en lenke til detaljsiden.
import { Link } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";

type TaskItemProps = {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  const { id, title, done } = task;

  return (
    // STEG 2B: tre trykkbare ting VED SIDEN AV hverandre - ingen inni hverandre:
    //   boksen -> toggle   tittelen -> detaljsiden   Slett -> slett
    // Da treffer et trykk alltid bare én av dem, også på web (der bobler et
    // klikk ellers videre til det som ligger utenpå).
    <View style={[styles.container, done && styles.containerDone]}>
      {/* STEG 2B: Pressable bare rundt boksen (før: boksen OG tittelen). */}
      <Pressable
        onPress={() => onToggle(id)}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
      >
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>

      {/*
        STEG 2B: tittelen er en LENKE til detaljsiden. href som objekt:
        pathname med [id] som plassholder, params fyller den inn.
        flex: 1 i styles.title skyver Slett helt til høyre.
      */}
      <Link
        href={{ pathname: "/tasks/[id]", params: { id } }}
        style={[styles.title, done && styles.titleDone]}
      >
        {title}
      </Link>

      {/*
        STEG 2A: vises for alle. Ola (user) får 403 fra webappen, og raden
        kommer tilbake. Skjule knappen er pynt - det er serveren som sperrer.
      */}
      <Pressable
        onPress={() => onRemove(id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Slett ${title}`}
      >
        <Text style={styles.remove}>Slett</Text>
      </Pressable>
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
    // STEG 2: textDark (fra live).
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
