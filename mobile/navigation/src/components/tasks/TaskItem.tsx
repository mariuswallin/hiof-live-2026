import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/shared/Icon";
import { Theme } from "@/constants/theme";
import type { Task } from "@/utils/task-schema";

type TaskItemProps = {
  task: Task;
  onToggle: (id: string) => void;
};

/**
 * Samme TaskItem som i demo-appen (samme props: task + onToggle, checkbox +
 * tittel i en rad), med to tillegg for navigasjon:
 *
 * - en ">" til høyre som viser at raden kan åpnes
 * - hele raden er en <Link> til detaljsiden
 *
 * <Link asChild> betyr: "ikke lag din egen knapp, gi navigasjonen videre til
 * barnet mitt". Da beholder vi vår egen Pressable og styling.
 *
 * href som objekt: pathname er ruten med [id] som plassholder, params fyller
 * den inn. Med typedRoutes sjekker TypeScript at ruten faktisk finnes.
 */
export function TaskItem({ task, onToggle }: TaskItemProps) {
  const { id, title, done } = task;

  return (
    <Link href={{ pathname: "/tasks/[id]", params: { id } }} asChild>
      {/*
        NB: vanlig style-objekt, IKKE style={({ pressed }) => ...}.
        Link asChild slår sammen sine props med barnets, og en style-FUNKSJON
        overlever ikke det på web - da forsvinner hele raden sin layout.
      */}
      <Pressable style={styles.container} accessibilityLabel={`Åpne ${title}`}>
        {/*
          Avkrysningsboksen er en egen Pressable. Den "stjeler" trykket, så et
          trykk her toggler bare - uten å navigere.
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

        <Text style={[styles.title, done && styles.titleDone]}>{title}</Text>

        {/* Ikon i stedet for tekst-tegnet ">": et ikon har fast størrelse og
            sentreres pent med alignItems, en tekst-glyf gjør ikke alltid det. */}
        <Icon
          ios="chevron.right"
          android="chevron_right"
          color={Theme.muted}
          size={18}
        />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  // Samme som originalen, men litt mer luft på sidene.
  container: {
    flexDirection: "row",
    // Alt i raden (boks, tittel, ">") sentreres vertikalt på samme linje.
    alignItems: "center",
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.surface,
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
