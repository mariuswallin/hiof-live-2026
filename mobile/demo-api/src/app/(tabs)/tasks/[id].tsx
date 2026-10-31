// STEG 2B: NY - detaljsiden. TaskItem.tsx (Link) -> HER.
// Henter med api/tasks.ts (getTask). Toggle/slett: contexts/TasksContext.tsx.
// STEG 2A: getTask trenger token fra contexts/AuthContext.tsx.

import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { getTask, type ApiTaskDetail } from "@/api/tasks";
import { Loading } from "@/components/shared/Loading";
import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TasksContext";

/**
 * STEG 2B: "/tasks/[id]" - DETALJSIDEN.
 *
 * Filnavnet [id].tsx: alt etter "/tasks/" havner i parameteren `id`.
 *   /tasks/abc123 -> { id: "abc123" }   (parametere er ALLTID strenger)
 *
 * Vi får bare id-en via navigasjonen. Resten slår vi opp selv - da er URL-en
 * alt som trengs for å åpne siden (dyplenker!):
 *   - tittel og status fra context: samme data som lista, oppdateres ved toggle
 *   - opprettet og frist fra webappen (getTask): det har ikke lista
 */
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // STEG 2A: tokenet, for getTask under.
  const { token } = useAuth();
  const { tasks, isLoading: isListLoading, toggleApi, removeApi } = useTasks();
  const task = tasks.find((t) => t.id === id);

  // Samme mønster som hentingen av lista i TasksContext: data, laster og feil.
  const [details, setDetails] = useState<ApiTaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // [id, token]: hent på nytt hvis id-en endrer seg, eller en annen logger inn.
  useEffect(() => {
    // STEG 2A: samme sjekk som i TasksContext. Uten token gir webappen 401.
    if (!token) return;

    async function load(token: string) {
      setIsLoading(true);
      setError("");
      try {
        setDetails(await getTask(token, id));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Ukjent feil");
      } finally {
        setIsLoading(false);
      }
    }

    load(token);
  }, [id, token]);

  // Etter alle hooks: hooks må kalles i samme rekkefølge ved hver render, så
  // en tidlig return kan ikke stå over dem.
  if (!task) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Finnes ikke" }} />
        {/* Dyplenke ved oppstart: lista er ikke hentet ennå. */}
        <Text>
          {isListLoading ? "Henter ..." : `Fant ingen oppgave med id "${id}".`}
        </Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.link}>Tilbake</Text>
        </Pressable>
      </View>
    );
  }

  // Feil vises i en Alert her: ved slett er skjermen allerede borte (se under).
  async function handleToggle() {
    try {
      await toggleApi(id);
    } catch (error) {
      Alert.alert(
        "Kunne ikke lagre",
        error instanceof Error ? error.message : "Ukjent feil",
      );
    }
  }

  async function handleRemove() {
    // Tilbake FØRST. removeApi er optimistisk og fjerner oppgaven fra context
    // med en gang - da finnes ikke lenger det denne skjermen viser.
    // router = navigasjon fra KODE. back() fjerner denne skjermen fra Stacken.
    router.back();

    try {
      await removeApi(id);
    } catch (error) {
      // Serveren sa nei: removeApi har lagt oppgaven tilbake i lista.
      // STEG 2A: som Ola er det alltid nei (403).
      Alert.alert(
        "Kunne ikke slette",
        error instanceof Error ? error.message : "Ukjent feil",
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* Dynamisk tittel: nå vet vi hvilken oppgave det er. */}
      <Stack.Screen options={{ title: task.title }} />

      <Text style={styles.title}>{task.title}</Text>
      <Text>Status: {task.done ? "Fullført ✓" : "Ikke fullført"}</Text>
      <Text style={styles.muted}>id: {task.id}</Text>

      {isLoading ? <Loading label="Henter detaljer ..." /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {details ? (
        <>
          {/* ISO-streng -> bare datoen: "2026-10-22T07:22:43.000Z" -> "2026-10-22" */}
          <Text>Opprettet: {details.createdAt.slice(0, 10)}</Text>
          <Text>
            Frist: {details.dueDate ? details.dueDate.slice(0, 10) : "ingen"}
          </Text>
        </>
      ) : null}

      <Pressable
        style={styles.button}
        onPress={handleToggle}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>
          {task.done ? "Marker som ikke fullført" : "Marker som fullført"}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.danger]}
        onPress={handleRemove}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Slett</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.background,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: "bold",
    color: Theme.text,
  },
  muted: {
    color: Theme.muted,
  },
  error: {
    color: Theme.danger,
  },
  link: {
    color: Theme.primary,
    fontWeight: "600",
  },
  button: {
    backgroundColor: Theme.primary,
    padding: 12,
    borderRadius: 4,
  },
  danger: {
    backgroundColor: Theme.danger,
  },
  buttonText: {
    color: Theme.textInverted,
    fontWeight: "bold",
    textAlign: "center",
  },
});
