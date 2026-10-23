// STEG 1: app/index.tsx (onRemove) -> HER (sendes videre) -> TaskItem.tsx
// STEG 2: (tabs)/tasks/index.tsx -> HER. TaskRegister flyttet til new-task.tsx.

import type { Task } from "@/utils/task-schema";
import { View, Text, StyleSheet } from "react-native";
import { TaskItem } from "./TaskItem";
import { Theme } from "@/constants/theme";

// STEG 2: onRegister og TaskRegister er fjernet - skjemaet er nå en egen
// skjerm (new-task.tsx). Lista viser bare lista.
type TaskListProps = {
  tasks: Task[];
  onToggle: (id: string) => void;
  // STEG 1: sendes bare videre til hver TaskItem, akkurat som onToggle.
  onRemove: (id: string) => void;
};

export function TaskList({ tasks, onToggle, onRemove }: TaskListProps) {
  // const [query, setQuery] = useState(["na"]);
  // // const [filtered, setFiltered] = useState(tasks);

  // const filteredData = tasks.filter((t) => t.name.includes(query));

  // // "naf"
  // // "nafi"
  // const handleFiltering = (searchValueFromTextBox: string) => {
  //   // ["na"]
  //   // ["na", "naf"]

  //   setQuery((prevSearchQuery) => [...prevSearchQuery, searchValueFromTextBox]);
  //   // ["na", "naf", "nafi"]
  //   // setFiltered((prev) =>
  //   //   prev.filter((v) => v.name.includes(searchValueFromTextBox)),
  //   // );
  // };

  // STEG 1: før returnerte vi bare "No tasks available" når lista var tom -
  // UTEN skjemaet. Med slett kan lista bli tom, og da kunne du ikke lage nye.
  // STEG 2: skjemaet bor nå i new-task.tsx ("+" i headeren), så det er alltid
  // tilgjengelig. Meldingen står igjen.
  return (
    <View style={styles.container}>
      {tasks.length === 0 ? <Text>No tasks available</Text> : null}
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
  },
});
