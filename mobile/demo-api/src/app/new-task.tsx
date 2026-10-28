import { TaskRegister } from "@/components/tasks/TaskRegister";
import { useTasks } from "@/contexts/TasksContext";
import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function NewTaskScreen() {
  const { addApi } = useTasks();

  async function handleCreateTask(name: string) {
    try {
      await addApi({ title: name, done: false });
      router.back();
    } catch (error) {
      // Håndtere feil og sørge for at det vises frem
    }
  }

  return (
    <View>
      <Text>Her er skjermen for å lage ny task</Text>
      <TaskRegister onRegister={handleCreateTask} />
      <Pressable onPress={() => router.back()}>
        <Text>Avbryt</Text>
      </Pressable>
    </View>
  );
}
