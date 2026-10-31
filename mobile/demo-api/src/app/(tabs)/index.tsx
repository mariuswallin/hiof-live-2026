// STEG 2B: NY - lenkene fra gamle app/index.tsx. Lista er flyttet til
// (tabs)/tasks/index.tsx, skjemaet til new-task.tsx.
// STEG 2A: navn, rolle og «Logg ut» fra contexts/AuthContext.tsx.
// Logg ut -> user blir null -> app/_layout.tsx viser login.tsx.

import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TasksContext";

/**
 * STEG 2B: "/" - Hjem-taben.
 *
 * (tabs) er en GRUPPE: parentesen organiserer filene, men blir ikke en del av
 * URL-en. (tabs)/index.tsx er derfor "/" - akkurat som app/index.tsx var.
 */
export default function HomeScreen() {
  const { user, isAdmin, logout } = useAuth();
  const { tasks } = useTasks();

  return (
    <View style={styles.container}>
      {/*
        STEG 2A: hvem er innlogget? Rollen kommer fra webappen. Ingen
        router.push() på Logg ut - Stack.Protected tar seg av det.
      */}
      <View style={styles.userRow}>
        <Text>{user ? `${user.name} (${user.role})` : null}</Text>
        <Pressable onPress={logout} hitSlop={8}>
          <Text style={styles.logout}>Logg ut</Text>
        </Pressable>
      </View>

      {/* STEG 2A: Ola ser bare sine egne oppgaver, Kari ser alle. */}
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
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  logout: {
    color: Theme.primary,
    fontWeight: "600",
  },
});
