import { router } from "expo-router";
import { Drawer, type DrawerNavigationProp } from "expo-router/drawer";
import type { ParamListBase } from "expo-router/react-navigation";

import { Icon } from "@/components/shared/Icon";
import { Theme } from "@/constants/theme";

/**
 * Skuff-valget "Oppgaver" skal alltid til Oppgaver-TABEN.
 *
 * Problemet: for skuffen er (tabs) bare ÉN skjerm. Uten denne lytteren havner
 * du i den taben du sist var i (typisk Hjem) - og står du allerede i (tabs),
 * lukker skuffen seg bare.
 *
 * Løsningen: lytt på trykket, stopp standardoppførselen og naviger selv.
 * Brukes som listeners={goToTasksTab} på <Drawer.Screen name="(tabs)">.
 */
function goToTasksTab({
  navigation,
}: {
  navigation: DrawerNavigationProp<ParamListBase>;
}) {
  return {
    drawerItemPress: (event: { preventDefault: () => void }) => {
      event.preventDefault(); // ikke gjør det skuffen ellers ville gjort
      navigation.closeDrawer(); // står vi allerede i (tabs), lukker ikke navigate skuffen
      router.navigate("/tasks"); // gå rett til Oppgaver-taben
    },
  };
}

/**
 * SKUFFEN (Drawer) - menyen som glir inn fra venstre.
 *
 * Åpnes med sveip fra venstre kant, eller med ☰-knappen (DrawerToggleButton)
 * som Drawer legger i headeren automatisk.
 *
 * Hver <Drawer.Screen> er en fil/mappe i (drawer)/. name = filnavnet.
 * Skjermer vi IKKE lister opp, kommer likevel med - men da i
 * alfabetisk rekkefølge og uten pene titler.
 */
export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerTintColor: Theme.primary,
        drawerActiveTintColor: Theme.primary,
        drawerActiveBackgroundColor: Theme.primaryLight,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Oppgaver",
          // Tab-baren har sine egne headere. Viser vi skuffens header også,
          // får vi TO headere oppå hverandre. Derfor skjuler vi denne, og
          // legger ☰-knappen inn i tabs sine headere i stedet.
          headerShown: false,
          drawerIcon: ({ color }) => (
            <Icon ios="checklist" android="checklist" color={color} />
          ),
        }}
        listeners={goToTasksTab}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Innstillinger",
          drawerIcon: ({ color }) => (
            <Icon ios="gearshape" android="settings" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          title: "Om appen",
          drawerIcon: ({ color }) => (
            <Icon ios="info.circle" android="info" color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
