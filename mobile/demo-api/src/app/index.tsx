import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { TaskLayout } from "@/components/tasks/TaskLayout";
import { TaskList } from "@/components/tasks/TaskList";
import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { TasksProvider, useTasks } from "@/contexts/TasksContext";
import { TASKS } from "@/data/tasks";
import { useIndexHook } from "@/hooks/useIndexHook";
import { Link } from "expo-router";
import { use, useEffect, useState } from "react";
import { Text, View, StyleSheet, type Task } from "react-native";

export default function Index() {
  // const { tasks: allMyTasks, toggle, add } = useIndexHook();
  const { isAdmin } = useAuth();

  const { tasks, addApi, toggleApi, removeApi, isLoading, error } = useTasks();
  const [saveError, setSaveError] = useState("");

  async function handleRegister(taskName: string) {
    try {
      await addApi({ title: taskName, done: false });
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Kunne ikke lagre");
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleApi(id);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Kunne ikke lagre");
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeApi(id);
      setSaveError("");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Kunne ikke slette",
      );
    }
  }

  return (
    <View style={styles.container}>
      <TaskLayout>
        {isLoading ? (
          <Loading label="Henter oppgaver fra webappen ..." />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        <TaskList
          tasks={tasks}
          onRegister={handleRegister}
          onRemove={handleRemove}
          onToggle={handleToggle}
        />
      </TaskLayout>
      <Text>Antall tasks: {tasks.length}</Text>
      {/* <Loading label={"Her laster vi ..."} />
      <Empty title={"Intet å vise"} onPress={myAwesomeFunction} />

      <Text>Edit src/app/index.tsx to edit this screen.</Text> */}
      <Link href="/about">Gå til about</Link>
      <Link href="/settings">Gå til settings</Link>
      <Link href="/students">Gå til studenter</Link>
      {isAdmin ? <Link href="/admin">Gå til admin</Link> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 8,
  },
  error: {
    color: Theme.danger,
    paddingVertical: 4,
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
