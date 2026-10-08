import { Tabs } from "expo-router/js-tabs";
import { DrawerToggleButton } from "expo-router/drawer";

import { Icon } from "@/components/icon";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/context/tasks-context";

/**
 * TAB-BAREN nederst på skjermen.
 *
 * Tabs vs Stack:
 * - Stack: skjermer LEGGES OPPÅ hverandre. "Tilbake" fjerner den øverste.
 * - Tabs:  skjermene ligger VED SIDEN AV hverandre. Alle lever samtidig og
 *          husker sin egen tilstand (scroll, input ...) når du bytter.
 *
 * Rekkefølgen på <Tabs.Screen> = rekkefølgen i tab-baren.
 */
export default function TabsLayout() {
  const { tasks } = useTasks();
  const openCount = tasks.filter((task) => !task.done).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.primary,
        tabBarInactiveTintColor: Theme.muted,
        headerTintColor: Theme.primary,
        // ☰-knappen som åpner skuffen. Den må inn her fordi vi skjulte
        // skuffens egen header i (drawer)/_layout.tsx.
        headerLeft: () => <DrawerToggleButton tintColor={Theme.primary} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hjem",
          tabBarIcon: ({ color }) => (
            <Icon ios="house" android="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Oppgaver",
          // Denne taben har sin EGEN Stack (tasks/_layout.tsx) med egen
          // header. Uten dette får vi dobbel header.
          headerShown: false,
          // Badge = det lille tallet på ikonet. undefined = ingen badge.
          tabBarBadge: openCount > 0 ? openCount : undefined,
          tabBarIcon: ({ color }) => (
            <Icon ios="checklist" android="checklist" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <Icon ios="person" android="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
