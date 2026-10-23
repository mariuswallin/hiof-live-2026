// STEG 1: app/index.tsx -> TaskList.tsx -> HER (onToggle fra props, ny Slett-knapp)
// STEG 2: (tabs)/tasks/index.tsx -> TaskList.tsx -> HER -> Link til (tabs)/tasks/[id].tsx

import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";
import type { Task } from "@/utils/task-schema";
// STEG 2: Link, for å gjøre raden til en lenke til detaljsiden.
import { Link } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";

type TaskItemProps = {
  task: Task;
  onToggle: (id: string) => void;
  // STEG 1: Slett-knappen sier bare ifra - forelderen bestemmer hva som skjer.
  onRemove: (id: string) => void;
};

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  const { id, title, done } = task;
  // STEG 1: henter ikke lenger toggle() herfra (se onPress under). tasks
  // brukes fortsatt til antallet i <Text> - samme context-demo som før.
  const { tasks } = useTasks();

  return (
    // STEG 2: raden er en vanlig View nå (før: Pressable som togglet).
    // Tre trykkbare ting VED SIDEN AV hverandre - ingen inni hverandre:
    //   boksen -> toggle   tittelen -> detaljsiden   Slett -> slett
    // Da treffer et trykk alltid bare én av dem, også på web (der bobler et
    // klikk ellers videre til det som ligger utenpå).
    <View style={[styles.container, done && styles.containerDone]}>
      {/*
        STEG 1: onToggle fra props, ikke toggle() fra context. Da er det
        forelderen ((tabs)/tasks/index.tsx) som bestemmer og viser feil.
        STEG 2: egen Pressable rundt boksen (før: hele raden).
      */}
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
      <Text>{tasks.length}</Text>

      {/*
        STEG 2: tittelen er en LENKE til detaljsiden. href som objekt:
        pathname med [id] som plassholder, params fyller den inn.
        (navigation-stack-tabs gjør hele raden til lenke med <Link asChild>.)
      */}
      <Link
        href={{ pathname: "/tasks/[id]", params: { id } }}
        style={[styles.title, done && styles.titleDone]}
      >
        {title}
      </Link>

      {/* STEG 1: Slett-knapp. */}
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
    color: Theme.text,
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
