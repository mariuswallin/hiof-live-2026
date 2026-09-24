import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { TaskLayout } from "@/components/tasks/TaskLayout";
import { TaskList } from "@/components/tasks/TaskList";
import { TasksProvider, useTasks } from "@/contexts/TasksContext";
import { TASKS } from "@/data/tasks";
import { useIndexHook } from "@/hooks/useIndexHook";
import { use, useEffect, useState } from "react";
import { Text, View, StyleSheet, type Task } from "react-native";

export default function Index() {
  // const { tasks: allMyTasks, toggle, add } = useIndexHook();

  const { tasks, add, toggle: onToggle } = useTasks();

  return (
    <View style={styles.container}>
      <TaskLayout>
        <TaskList tasks={tasks} onRegister={add} onToggle={onToggle} />
      </TaskLayout>
      <Text>Antall tasks: {tasks.length}</Text>
      {/* <Loading label={"Her laster vi ..."} />
      <Empty title={"Intet å vise"} onPress={myAwesomeFunction} />

      <Text>Edit src/app/index.tsx to edit this screen.</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 8,
  },
});

// function callBackExample(fn: (data: any) => void) {
//   const user = { id: 1, name: "John Doe" };

//   const fetcher = async () => {
//     // Simulate an API call to fetch user data
//     const response = await fetch("");
//     const userData = await response.json();
//     return userData;
//   };

//   const callback = () => fn({ ...user, updatedAt: new Date(), fetcher });

//   // Return the callback function
//   return callback;
// }

// const task = { id: 1, title: "Task 1", done: false };

// callBackExample((prev) => {
//   const handler = prev.fetcher;
// handler()
//   console.log({ ...prev, task });
// });
