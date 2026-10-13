import type { Task } from "@/utils/task-schema";
import { View, Text, StyleSheet } from "react-native";
import { TaskItem } from "./TaskItem";
import { Theme } from "@/constants/theme";
import { TaskRegister } from "./TaskRegister";

type TaskListProps = {
  tasks: Task[];
  onRegister: (taskName: string) => void;
  onToggle: (id: string) => void;
};

export function TaskList({ tasks, onRegister, onToggle }: TaskListProps) {
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

  if (tasks.length === 0) {
    return (
      <View>
        <Text>No tasks available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TaskRegister onRegister={onRegister} />
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} />
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
