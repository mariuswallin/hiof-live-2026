// STEG 2B: NY - tab-baren. app/_layout.tsx (rot-Stack) -> HER -> (tabs)/index.tsx
// og (tabs)/tasks/_layout.tsx. Ikonene: components/shared/Icon.tsx.

import { Tabs } from "expo-router/js-tabs";

import { Icon } from "@/components/shared/Icon";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";

/**
 * STEG 2B: TAB-BAREN nederst på skjermen.
 *
 *   Stack: skjermer LEGGES OPPÅ hverandre. "Tilbake" fjerner den øverste.
 *   Tabs:  skjermene ligger VED SIDEN AV hverandre. Alle lever samtidig og
 *          husker sin egen tilstand (scroll, input ...) når du bytter.
 *
 * name = filen eller mappen i (tabs)/. Rekkefølgen her = rekkefølgen i baren.
 */
export default function TabsLayout() {
  // Tab-baren er bare en komponent til som leser fra context - derfor kan
  // badgen vise antall åpne oppgaver, og oppdateres når du toggler.
  const { tasks } = useTasks();
  const openCount = tasks.filter((task) => !task.done).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.primary,
        tabBarInactiveTintColor: Theme.muted,
        headerTintColor: Theme.primary,
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
          // Taben har sin EGEN Stack med header (tasks/_layout.tsx). Uten
          // dette får vi to headere oppå hverandre.
          headerShown: false,
          // Badge = det lille tallet på ikonet. undefined = ingen badge.
          tabBarBadge: openCount > 0 ? openCount : undefined,
          tabBarIcon: ({ color }) => (
            <Icon ios="checklist" android="checklist" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
