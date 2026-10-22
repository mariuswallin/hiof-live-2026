import { Image } from "expo-image";
import {
  Stack,
  router,
  useLocalSearchParams,
  type ErrorBoundaryProps,
} from "expo-router";
import { use } from "react";
import { StyleSheet, Text } from "react-native";

import { cached, forget } from "@/api/cache";
import { getTask } from "@/api/tasks";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Empty } from "@/components/shared/Empty";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";
import { useTasks } from "@/contexts/TasksContext";

/** Nøkkelen for én oppgave i cachen (api/cache.ts). */
const taskKey = (id: string) => `tasks/${id}`;

/**
 * "/tasks/[id]" - DETALJSIDEN.
 *
 * Filnavnet [id].tsx gjør at ALT etter "/tasks/" havner i parameteren `id`:
 *   /tasks/3   -> { id: "3" }
 *   /tasks/abc -> { id: "abc" }
 *
 * NB: parametere fra URL-en er ALLTID strenger. Skal du regne med dem,
 * må du gjøre dem om selv.
 *
 * Henter oppgaven fra webappen (GET /api/v1/tasks/:id) med React 19 sin
 * use(), og lar Expo Router ta seg av resten:
 *   venter -> SuspenseFallback fra tasks/_layout.tsx
 *   feiler -> ErrorBoundary nederst i denne fila
 * Sammenlign med users/[userId].tsx: der gjør useEffect + useState den jobben.
 */
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Ingen isLoading: TasksProvider har lista FØR noen skjerm rendres
  // (use() + Suspense i _layout.tsx).
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

  /**
   * use() ETTER en if/return - det går ikke med vanlige hooks (useState,
   * useEffect ...), men use() er unntaket. Finnes ikke oppgaven lokalt,
   * spør vi aldri API-et.
   *
   * cached(): samme id = samme promise. Gå tilbake og inn igjen på samme
   * oppgave: svaret ligger klart, og ingen laster-skjerm vises.
   * (users/[userId].tsx har ingen cache - der hentes alt på nytt.)
   *
   * Prøv: bytt addApi med add i new-task.tsx, lag en oppgave og åpne den.
   * id-en (Date.now()) finnes ikke i webappen, så du får 404 - og ser
   * ErrorBoundary. Med addApi kom id-en FRA webappen, og den finnes.
   */
  const apiTask = use(cached(taskKey(task.id), () => getTask(task.id)));

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
        API-ets versjon av SAMME oppgave. Toggle over, og "Lokalt" endres,
        men ikke denne - API-et vet ingenting om lokale endringer.

        Ingen laster- eller feil-sjekk: kommer vi hit, HAR vi apiTask.
      */}
      <Card title="Fra API (use + Suspense)">
        {/*
          Bilde fra nett: source er en URL-streng. Til forskjell fra <img>
          på web har et bilde i React Native INGEN størrelse av seg selv -
          uten width/height (eller aspectRatio) blir det 0x0 og usynlig.

          Vi bygger URL-en fra data vi nettopp hentet (tittelen), så
          bildet endres med oppgaven i navigasjonen.

          expo-image i stedet for Image fra react-native: cacher bildet på
          disk og har contentFit (som object-fit i CSS) og transition.
          Lokale bilder: source={require("@/assets/images/icon.png")}.
        */}
        <Image
          source={`https://dummyjson.com/image/600x300/1565c0/ffffff?text=${encodeURIComponent(apiTask.title)}`}
          style={styles.image}
          contentFit="cover"
          transition={200}
          accessibilityLabel={apiTask.title}
        />
        <Text style={styles.text}>«{apiTask.title}»</Text>
        <Text style={styles.muted}>
          {apiTask.completed ? "Fullført" : "Ikke fullført"} i API-et
        </Text>
      </Card>
    </Screen>
  );
}

/**
 * FEIL - Expo Router-konvensjon: eksporter ErrorBoundary fra rutefila.
 *
 * Kaster use() (404, 500, ingen nett), vises denne i stedet for skjermen.
 * Tab-baren og headeren står - bare innholdet byttes ut.
 *
 * "Prøv igjen": glem promiset som feilet, og la retry() rendre skjermen på
 * nytt. Da henter use() på nytt.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // ErrorBoundary er en vanlig komponent - hooks virker her også.
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <Empty
        title="Klarte ikke å hente"
        hint={error.message}
        actionLabel="Prøv igjen"
        onPress={() => {
          forget(taskKey(id));
          retry();
        }}
      />
    </Screen>
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
});
