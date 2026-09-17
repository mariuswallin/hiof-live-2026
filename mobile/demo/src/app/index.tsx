import { useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskRegisterSchema } from "@/components/form_draft/TaskRegisterSchema";
import { TaskRegisterSimple } from "@/components/form_draft/TaskRegisterSimple";
import { TaskRegisterTanstack } from "@/components/form_draft/TaskRegisterTanstack";
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

/** Tre måter å lage "ny oppgave"-skjemaet på. */
const FORM_VARIANTS = [
  { id: "simple", label: "Enkel" },
  { id: "schema", label: "Schema" },
  { id: "tanstack", label: "TanStack Form" },
] as const;

type FormVariantId = (typeof FORM_VARIANTS)[number]["id"];

export default function Index() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<VariantId>("flat");
  const [formVariant, setFormVariant] = useState<FormVariantId>("simple");

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

  // Skjemaet gir oss bare en gyldig tittel. id og done bestemmer appen.
  const addTask = (title: string) => {
    const task: Task = { id: String(Date.now()), title, done: false };
    // Ny array med den nye oppgaven sist - aldri push() på den gamle.
    setTasks((current) => [...(current ?? []), task]);
    // Tastaturet lukker seg IKKE av seg selv når man trykker "Legg til".
    // Retur-tasten blurer feltet (submitBehavior er "blurAndSubmit" som
    // standard for enlinjes TextInput), men en vanlig knapp gjør ingenting
    // med fokus. Da blir tastaturet stående og dekker lista under.
    // Keyboard.dismiss() fjerner fokus og lukker tastaturet.
    Keyboard.dismiss();
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
        <Switcher
          options={FORM_VARIANTS}
          selected={formVariant}
          onSelect={setFormVariant}
        />
        <View style={styles.form}>
          <TaskRegisterVariant variant={formVariant} onAdd={addTask} />
        </View>

        <Switcher options={VARIANTS} selected={variant} onSelect={setVariant} />

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

type SwitcherProps<T extends string> = {
  options: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
};

/**
 * Rad med "chips". Generisk (<T>) så den kan brukes både for liste- og
 * skjema-variantene, og fortsatt bare godtar gyldige id-er.
 */
function Switcher<T extends string>({
  options,
  selected,
  onSelect,
}: SwitcherProps<T>) {
  return (
    <View style={styles.switcher}>
      {options.map((item) => {
        const isSelected = item.id === selected;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
          >
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type TaskRegisterVariantProps = {
  variant: FormVariantId;
  onAdd: (title: string) => void;
};

/**
 * Alle tre har samme props (onAdd), så de er helt utbyttbare for forelderen.
 * `key` tvinger en ny komponent ved bytte, så state ikke henger igjen.
 */
function TaskRegisterVariant({ variant, onAdd }: TaskRegisterVariantProps) {
  switch (variant) {
    case "simple":
      return <TaskRegisterSimple key={variant} onAdd={onAdd} />;
    case "schema":
      return <TaskRegisterSchema key={variant} onAdd={onAdd} />;
    case "tanstack":
      return <TaskRegisterTanstack key={variant} onAdd={onAdd} />;
  }
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
        <Empty
          title="Ingen oppgaver"
          hint="Legg til en oppgave for å starte."
        />
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
        <ScrollView
          contentContainerStyle={styles.state}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
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
  form: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
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
