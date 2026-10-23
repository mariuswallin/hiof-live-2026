// STEG 2: NY - lenkene fra gamle app/index.tsx. Lista er flyttet til
// (tabs)/tasks/index.tsx, skjemaet til new-task.tsx.

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TasksContext";

/**
 * STEG 2: "/" - Hjem-taben.
 *
 * (tabs) er en GRUPPE: parentesen organiserer filene, men blir ikke en del av
 * URL-en. (tabs)/index.tsx er derfor "/" - akkurat som app/index.tsx var.
 */
export default function HomeScreen() {
  const { isAdmin } = useAuth();
  const { tasks } = useTasks();

  return (
    <View style={styles.container}>
      <Text>Antall tasks: {tasks.length}</Text>

      {/* Bytter til Oppgaver-taben - samme som å trykke på den. */}
      <Link href="/tasks">Gå til oppgaver</Link>
      {/* Ligger i rot-Stacken, UTENFOR tabs - legges oppå, uten tab-bar. */}
      <Link href="/new-task">Ny oppgave</Link>

      {/* Uendret fra gamle app/index.tsx. */}
      <Link href="/about">Gå til about</Link>
      <Link href="/settings">Gå til settings</Link>
      <Link href="/students">Gå til studenter</Link>
      {isAdmin ? <Link href="/admin">Gå til admin</Link> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 8,
    gap: Theme.spacing.sm,
  },
});
