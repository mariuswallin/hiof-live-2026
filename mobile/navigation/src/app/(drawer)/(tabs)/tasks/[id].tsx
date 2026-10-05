import { Image } from "expo-image";
import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { fetchTodo, type Todo } from "@/api/dummy-json";
import { Card } from "@/components/card";
import { Empty } from "@/components/empty";
import { Loading } from "@/components/loading";
import { Screen } from "@/components/screen";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/context/tasks-context";

/**
 * "/tasks/[id]" - DETALJSIDEN.
 *
 * Filnavnet [id].tsx gjør at ALT etter "/tasks/" havner i parameteren `id`:
 *   /tasks/3   -> { id: "3" }
 *   /tasks/abc -> { id: "abc" }
 *
 * NB: parametere fra URL-en er ALLTID strenger. Skal du regne med dem,
 * må du gjøre dem om selv.
 */
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, toggle, remove } = useTasks();

  // Vi får bare id-en via navigasjonen - selve oppgaven slår vi opp selv.
  // Da er detaljsiden alltid oppdatert, og URL-en er alt som trengs for å
  // åpne den (dyplenker!).
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Finnes ikke" }} />
        <Empty
          title="Fant ikke oppgaven"
          hint={`Ingen oppgave med id "${id}".`}
          actionLabel="Tilbake"
          onPress={() => router.back()}
        />
      </Screen>
    );
  }

  const handleDelete = () => {
    remove(task.id);
    // router = navigasjon fra KODE (ikke fra et trykk på en Link).
    // back() fjerner denne skjermen fra Stacken.
    router.back();
  };

  return (
    <Screen>
      {/* Dynamisk tittel: nå vet vi hvilken oppgave det er. */}
      <Stack.Screen options={{ title: task.title }} />

      <Card title="Lokalt (fra context)">
        <Text style={styles.text}>id: {task.id}</Text>
        <Text style={styles.text}>
          Status: {task.done ? "Fullført ✓" : "Ikke fullført"}
        </Text>
        <Button
          label={task.done ? "Marker som ikke fullført" : "Marker som fullført"}
          onPress={() => toggle(task.id)}
        />
        <Button label="Slett" onPress={handleDelete} danger />
      </Card>

      {/*
        key={id}: får komponenten en ny id, lages den på nytt med tom state.
        Da slipper vi å nullstille data/feil manuelt inne i useEffect.
      */}
      <RemoteTodo key={task.id} id={task.id} />
    </Screen>
  );
}

/**
 * Henter "tvillingen" fra dummyjson.com/todos/:id med useEffect.
 *
 * Dette er den "manuelle" måten. Vi må selv holde styr på TRE tilstander:
 * data, laster, feil. (Sammenlign med useQuery i user/[userId].tsx.)
 *
 * Prøv: legg til en ny oppgave og åpne den. id-en (Date.now()) finnes ikke
 * i API-et, så du får 404 - og ser feil-tilstanden.
 */
function RemoteTodo({ id }: { id: string }) {
  const [todo, setTodo] = useState<Todo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Kjører etter første render, og på nytt hver gang `id` endres
  // (dependency-arrayet). Tomt array = bare én gang.
  useEffect(() => {
    // AbortController: hvis brukeren trykker "tilbake" før svaret kommer,
    // avbryter vi forespørselen. Ellers kan et gammelt svar komme inn og
    // overskrive state for en skjerm som ikke lenger finnes.
    const controller = new AbortController();

    fetchTodo(id, controller.signal)
      .then(setTodo)
      .catch((e: unknown) => {
        // Avbrudd er ikke en feil - det var vi som ba om det.
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Ukjent feil");
      });

    // Opprydding: kjøres når skjermen forsvinner, eller FØR effekten kjøres
    // på nytt med ny id.
    return () => controller.abort();
  }, [id]);

  return (
    <Card title="Fra API (useEffect)">
      {error ? (
        <Empty title="Klarte ikke å hente" hint={error} />
      ) : !todo ? (
        <Loading label="Henter fra dummyjson ..." />
      ) : (
        <>
          {/*
            Bilde fra nett: source er en URL-streng. Til forskjell fra <img>
            på web har et bilde i React Native INGEN størrelse av seg selv -
            uten width/height (eller aspectRatio) blir det 0x0 og usynlig.

            Vi bygger URL-en fra data vi nettopp hentet (todo.id og tekst),
            så bildet endres med id-en i navigasjonen.

            expo-image i stedet for Image fra react-native: cacher bildet på
            disk og har contentFit (som object-fit i CSS) og transition.
            Lokale bilder: source={require("@/assets/images/icon.png")}.
          */}
          <Image
            source={`https://dummyjson.com/image/600x300/1565c0/ffffff?text=${encodeURIComponent(`#${todo.id} ${todo.todo}`)}`}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityLabel={todo.todo}
          />
          <Text style={styles.text}>«{todo.todo}»</Text>
          <Text style={styles.muted}>
            {todo.completed ? "Fullført" : "Ikke fullført"} i API-et
          </Text>

          {/*
            Vi sender id-en VIDERE i navigasjonen. Neste skjerm legges oppå
            denne i samme Stack - så "tilbake" kommer hit igjen.
          */}
          <Link
            href={{
              pathname: "/tasks/user/[userId]",
              params: { userId: String(todo.userId) },
            }}
            style={styles.link}
          >
            Se hvem som eier den →
          </Link>
        </>
      )}
    </Card>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function Button({ label, onPress, danger }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        danger && styles.buttonDanger,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: Theme.fontSize.md,
    color: Theme.text,
  },
  muted: {
    fontSize: Theme.fontSize.sm,
    color: Theme.muted,
  },
  image: {
    width: "100%",
    aspectRatio: 2, // bredde / høyde = 600 / 300
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.primaryLight,
  },
  link: {
    marginTop: Theme.spacing.sm,
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
  buttonDanger: {
    backgroundColor: Theme.danger,
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
