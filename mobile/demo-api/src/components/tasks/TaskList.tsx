// STEG 2B: (tabs)/tasks/index.tsx -> HER -> TaskItem.tsx.
// TaskRegister er flyttet til app/new-task.tsx.

import type { Task } from "@/utils/task-schema";
import { View, Text, StyleSheet } from "react-native";
import { TaskItem } from "./TaskItem";
import { Theme } from "@/constants/theme";

// STEG 2B: onRegister og TaskRegister er fjernet - skjemaet er nå en egen
// skjerm (new-task.tsx, "+" i headeren). Lista viser bare lista.
type TaskListProps = {
  tasks: Task[];
  onToggle: (id: string) => void;
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
