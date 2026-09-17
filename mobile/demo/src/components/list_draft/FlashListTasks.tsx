import { FlashList } from "@shopify/flash-list";
import { StyleSheet, Text, View } from "react-native";

import { TaskItem } from "@/components/tasks_draft/TaskItem";
import { Theme } from "@/constants/theme";
import type { Task } from "@/utils_draft/task-schema";

type FlashListTasksProps = {
  tasks: Task[];
  onToggle?: (id: string) => void;
};

/**
 * 4) FlashList - FlatList-erstatteren fra Shopify.
 *
 * Samme API som FlatList (data, renderItem, keyExtractor ...), så bytter du
 * ut navnet og importen er du stort sett i mål. Forskjellen ligger under
 * panseret: FlashList GJENBRUKER radene som scroller ut av skjermen i stedet
 * for å lage nye. Det merkes på lange lister med tunge rader.
 *
 * Merk: i versjon 2 er `estimatedItemSize` borte - biblioteket måler radene
 * selv. Ser du den propen i eldre eksempler på nett, er det v1.
 *
 * Bruk når: lista er lang (hundrevis+) eller scrollingen hakker med FlatList.
 * Ellers: FlatList holder lenge, og er én avhengighet mindre.
 */
export function FlashListTasks({ tasks, onToggle }: FlashListTasksProps) {
  return (
    <FlashList
      data={tasks}
      keyExtractor={(task) => task.id}
      renderItem={({ item }) => <TaskItem task={item} onToggle={onToggle} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.empty}>Ingen oppgaver</Text>}
      contentContainerStyle={styles.content}
      // Samme tastatur-props som ScrollView - se ScrollViewList.
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    // NB: FlashList tar ikke `gap` her - avstanden mellom radene lager vi
    // med ItemSeparatorComponent i stedet.
    padding: Theme.spacing.lg,
  },
  separator: {
    height: Theme.spacing.sm,
  },
  empty: {
    padding: Theme.spacing.xl,
    textAlign: "center",
    color: Theme.muted,
  },
});
