import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FlashListTasks } from "@/components/list_draft/FlashListTasks";
import { FlatListTasks } from "@/components/list_draft/FlatListTasks";
import { MapList } from "@/components/list_draft/MapList";
import { ScrollViewList } from "@/components/list_draft/ScrollViewList";
import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { TaskLayout } from "@/components/tasks_draft/TaskLayout";
import { TaskList } from "@/components/tasks_draft/TaskList";
import { TASKS } from "@/constants/tasks";
import { Theme } from "@/constants/theme";
import { validateTasks, type Task } from "@/utils_draft/task-schema";

/** Måtene å rendre en liste på, i den rekkefølgen vi går gjennom dem. */
const VARIANTS = [
  { id: "map", label: ".map()" },
  { id: "scroll", label: "ScrollView" },
  { id: "flat", label: "FlatList" },
  { id: "flash", label: "FlashList" },
  { id: "component", label: "TaskList" },
] as const;

type VariantId = (typeof VARIANTS)[number]["id"];

export default function Index() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<VariantId>("flat");

  // Står i stedet for et ekte API-kall. Poenget er at data utenfra kommer
  // ETTER første render - derfor tom state først, og derfor Loading.
  useEffect(() => {
    const result = validateTasks(TASKS);

    if (result.success) {
      setTasks(result.data);
    } else {
      setError(result.errors.map((e) => `${e.field}: ${e.message}`).join("\n"));
    }
  }, []);

  // Én callback som eier endringen. Radene sier bare ifra HVEM som ble trykket.
  const toggle = (id: string) => {
    // Ny array + nye objekter. Muterer vi den gamle, ser React ingen endring.
    setTasks((current) =>
      (current ?? []).map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  };

  const doneCount = tasks?.filter((task) => task.done).length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TaskLayout
        title="Oppgaver"
        subtitle="Samme data, fem måter å rendre lista på"
        footer={
          <Text style={styles.footerText}>
            {tasks ? `${doneCount} av ${tasks.length} fullført` : "Laster ..."}
          </Text>
        }
      >
        <View style={styles.switcher}>
          {VARIANTS.map((item) => {
            const selected = item.id === variant;

            return (
              <Pressable
                key={item.id}
                onPress={() => setVariant(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.body}>
          <TaskListVariant
            variant={variant}
            tasks={tasks}
            error={error}
            onToggle={toggle}
          />
        </View>
      </TaskLayout>
    </SafeAreaView>
  );
}

type TaskListVariantProps = {
  variant: VariantId;
  tasks: Task[] | null;
  error: string | null;
  onToggle: (id: string) => void;
};

/**
 * Egen komponent for "hvilken tilstand er vi i". Da slipper Index en trapp
 * av if-er inne i JSX-en, og rekkefølgen blir tydelig: feil, laster, tom, data.
 */
function TaskListVariant({
  variant,
  tasks,
  error,
  onToggle,
}: TaskListVariantProps) {
  if (error) {
    return (
      <View style={styles.state}>
        <Empty title="Ugyldige data" hint={error} />
      </View>
    );
  }

  if (!tasks) {
    return (
      <View style={styles.state}>
        <Loading label="Henter oppgaver ..." />
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.state}>
        <Empty title="Ingen oppgaver" hint="Legg til en oppgave for å starte." />
      </View>
    );
  }

  // switch uten default: legger vi til en variant i VARIANTS, sier TypeScript
  // ifra her fordi returtypen da kan bli undefined.
  switch (variant) {
    case "map":
      // Scroller IKKE. Med nok oppgaver forsvinner de nederste ut av skjermen
      // uten at du kommer til dem - det er nettopp poenget med eksempelet.
      return <MapList tasks={tasks} onToggle={onToggle} />;
    case "scroll":
      return <ScrollViewList tasks={tasks} onToggle={onToggle} />;
    case "flat":
      return <FlatListTasks tasks={tasks} onToggle={onToggle} />;
    case "flash":
      return <FlashListTasks tasks={tasks} onToggle={onToggle} />;
    case "component":
      // Den ferdige komponenten: .map() med skillelinjer og egen tom-tilstand,
      // pakket inn i en ScrollView siden den ikke scroller selv.
      return (
        <ScrollView contentContainerStyle={styles.state}>
          <TaskList tasks={tasks} onToggle={onToggle} />
        </ScrollView>
      );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.surface,
  },
  switcher: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  chipSelected: {
    borderColor: Theme.primary,
    backgroundColor: Theme.primaryLight,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipText: {
    fontSize: Theme.fontSize.md,
    color: Theme.muted,
  },
  chipTextSelected: {
    color: Theme.primary,
    fontWeight: "700",
  },
  // Lista må ha en boks med høyde å scrolle innenfor.
  body: {
    flex: 1,
  },
  state: {
    padding: Theme.spacing.lg,
  },
  footerText: {
    fontSize: Theme.fontSize.md,
    color: Theme.muted,
    textAlign: "center",
  },
});
