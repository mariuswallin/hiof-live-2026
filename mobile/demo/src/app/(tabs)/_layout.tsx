import { Icon } from "@/components/shared/Icon";
import { useTasks } from "@/contexts/TasksContext";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const { incompleteTasks } = useTasks();
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Hjem",
          tabBarIcon: ({ color }) => (
            <Icon ios="house" android="house" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Oppgaver",
          headerShown: false,
          tabBarBadge:
            incompleteTasks.length > 0 ? incompleteTasks.length : undefined,
          tabBarIcon: ({ color }) => (
            <Icon ios="checklist" android="checklist" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
