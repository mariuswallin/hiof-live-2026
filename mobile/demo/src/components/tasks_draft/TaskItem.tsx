import { Pressable, StyleSheet, Text, View } from "react-native";

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
  // Uten onToggle er raden read-only. Da vil vi verken ha trykkflate eller
  // tilgjengelighets-rolle - så vi bestemmer det ETT sted, her.
  const readOnly = !onToggle;

  return (
    <Pressable
      // ?. gjør at kallet bare skjer hvis onToggle faktisk finnes.
      onPress={() => onToggle?.(task.id)}
      disabled={readOnly}
      // Style kan være en FUNKSJON av trykketilstanden. Arrayet slås sammen
      // ovenfra og ned, og false/undefined hoppes over - slik legger vi på
      // containerDone bare når oppgaven er fullført.
      style={({ pressed }) => [
        styles.container,
        task.done && styles.containerDone,
        pressed && styles.containerPressed,
      ]}
      // Skjermleser: si ifra at dette er en avkrysningsboks, og om den er huket av.
      accessibilityRole={readOnly ? undefined : "checkbox"}
      accessibilityState={{ checked: task.done, disabled: readOnly }}
      accessibilityLabel={task.title}
    >
      <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
        {task.done ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={[styles.title, task.done && styles.titleDone]}>
        {task.title}
      </Text>
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
  // Klar til bruk når raden skal vise fullført/ikke fullført
  containerDone: {
    backgroundColor: Theme.primaryLight,
    borderColor: Theme.primary,
  },
  // Litt visuell kvittering på at trykket ble registrert
  containerPressed: {
    opacity: 0.6,
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
