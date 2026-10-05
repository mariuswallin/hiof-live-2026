import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/context/tasks-context";

/**
 * "/" - Hjem-taben. Appen MÅ ha en rute for "/", og det er denne.
 * (Gruppene (drawer) og (tabs) teller ikke i URL-en.)
 *
 * Skjermen viser de ulike måtene å navigere på.
 */
export default function HomeScreen() {
  const { tasks } = useTasks();
  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <Screen>
      <Card title="Status">
        <Text style={styles.big}>
          {doneCount} av {tasks.length}
        </Text>
        <Text style={styles.muted}>oppgaver fullført</Text>
      </Card>

      <Card title="Navigere med <Link>">
        {/* Bytter til Oppgaver-taben - samme som å trykke på den. */}
        <Link href="/tasks" style={styles.link}>
          Gå til oppgaver →
        </Link>

        {/*
          Rett inn på en detaljside i en ANNEN tab. Takket være
          initialRouteName i tasks/_layout.tsx ligger lista under,
          så "tilbake" virker.
        */}
        <Link
          href={{ pathname: "/tasks/[id]", params: { id: "3" } }}
          style={styles.link}
        >
          Åpne oppgave 3 direkte →
        </Link>

        {/* En skjerm som bare finnes i skuffen. */}
        <Link href="/about" style={styles.link}>
          Om appen (skuff-skjerm) →
        </Link>
      </Card>

      <Card title="Navigere fra kode med router">
        {/*
          router.push brukes når navigasjonen skjer som RESULTAT av noe
          (lagret skjema, ferdig innlogging ...), ikke bare et trykk.
          push     = legg oppå (kan gå tilbake)
          replace  = bytt ut (kan IKKE gå tilbake - f.eks. etter innlogging)
          back     = gå ett steg tilbake
        */}
        <Pressable
          onPress={() => router.push("/new-task")}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Ny oppgave (modal)</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: {
    fontSize: 40,
    fontWeight: "700",
    color: Theme.primary,
  },
  muted: {
    fontSize: Theme.fontSize.md,
    color: Theme.muted,
  },
  link: {
    paddingVertical: Theme.spacing.xs,
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Theme.primary,
  },
  button: {
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.primary,
  },
  pressed: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.md,
    fontWeight: "700",
  },
});
