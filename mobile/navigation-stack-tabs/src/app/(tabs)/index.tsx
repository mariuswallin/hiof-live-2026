import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { Card } from "@/components/shared/Card";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TasksContext";

/**
 * "/" - Hjem-taben. Appen MÅ ha en rute for "/", og det er denne.
 * (Gruppen (tabs) teller ikke i URL-en.)
 *
 * Skjermen viser de ulike måtene å navigere på.
 */
export default function HomeScreen() {
  const { tasks, isLoading } = useTasks();
  const doneCount = tasks.filter((task) => task.done).length;
  // Samme bruker som på Profil - begge leser fra AuthContext, ingen henter selv.
  const { user, isAdmin } = useAuth();

  return (
    <Screen>
      {/* Rot-_layout.tsx venter på brukeren, men typen tillater null. */}
      <Card title={user ? `Hei, ${user.firstName}!` : "Hei!"}>
        <Text style={styles.muted}>
          {user?.email} · {user?.role}
        </Text>
      </Card>

      {/*
        Bare admin ser denne lenken. Men å skjule LENKEN er ikke nok -
        hvem som helst kan skrive /admin i adressefeltet eller åpne en
        dyplenke. Selve ruten beskyttes med Stack.Protected i _layout.tsx.
      */}
      {isAdmin ? (
        <Card title="Admin">
          <Link href="/admin" style={styles.link}>
            Åpne admin-panelet →
          </Link>
        </Card>
      ) : null}

      <Card title="Status">
        <Text style={styles.big}>
          {isLoading ? "…" : `${doneCount} av ${tasks.length}`}
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

        {/* En skjerm UTENFOR tabs - legges oppå, uten tab-bar. */}
        <Link href="/about" style={styles.link}>
          Om appen (uten tab-bar) →
        </Link>

        {/*
          Mappe med dynamisk rute UTENFOR tabs (app/users/). Samme mønster
          som oppgavene, men uten tab-bar. Direktelenken hopper over lista -
          initialRouteName i users/_layout.tsx legger den under likevel.
        */}
        <Link href="/users" style={styles.link}>
          Brukere (utenfor tabs) →
        </Link>
        <Link
          href={{ pathname: "/users/[userId]", params: { userId: "68" } }}
          style={styles.link}
        >
          Åpne bruker 68 direkte →
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
          <Text style={styles.buttonText}>Ny oppgave</Text>
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
