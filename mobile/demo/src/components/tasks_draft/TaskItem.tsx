import { StyleSheet, Text, View } from "react-native";

import { Theme } from "@/constants/theme";
import type { Task } from "@/utils_draft/task-schema";

/**
 * Props = argumentene til komponenten.
 *
 * - task:     dataene raden skal vise. Vi gjenbruker Task-typen fra zod-skjemaet,
 *             så komponenten og valideringen aldri kommer i utakt.
 * - onToggle: en CALLBACK. TaskItem eier ikke state - den sier bare ifra
 *             "brukeren trykket på denne id-en", og lar forelderen bestemme
 *             hva som skal skje. Dette kalles "lifting state up".
 *             Optional (?) fordi raden også skal kunne vises read-only.
 */
type TaskItemProps = {
  task: Task;
  onToggle?: (id: string) => void;
};

export function TaskItem({ task, onToggle }: TaskItemProps) {
  // TODO (demo): legg til Pressable/checkbox som kaller onToggle?.(task.id)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
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
  // Klar til bruk når raden skal vise fullført/ikke fullført
  containerDone: {
    backgroundColor: Theme.primaryLight,
    borderColor: Theme.primary,
  },
  // Boksen til venstre (checkbox / ikon)
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
    // flex: 1 = ta all plass som er igjen, slik at lang tekst brytes
    // i stedet for å presse resten av raden ut av skjermen.
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Theme.text,
  },
  titleDone: {
    color: Theme.muted,
    textDecorationLine: "line-through",
  },
});
