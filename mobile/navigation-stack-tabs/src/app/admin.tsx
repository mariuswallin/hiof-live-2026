import { StyleSheet, Text } from "react-native";

import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TasksContext";

/**
 * "/admin" - BESKYTTET skjerm, kun for brukere med role: "admin".
 *
 * Det er ikke fila som beskytter den, men rot-_layout.tsx:
 *   <Stack.Protected guard={isAdmin}>
 *     <Stack.Screen name="admin" />
 *   </Stack.Protected>
 *
 * Derfor trenger ikke skjermen sjekke rollen selv: rendres den, er
 * brukeren admin. Prøv som vanlig bruker å åpne /admin direkte i
 * adressefeltet - du havner på forsiden.
 *
 * Ligger i rot-Stacken (som new-task.tsx), altså utenfor tabs. Den kan
 * åpnes fra hvor som helst, og legger seg over tab-baren.
 */
export default function AdminScreen() {
  const { user, loginAs } = useAuth();
  const { tasks, remove } = useTasks();
  const doneTasks = tasks.filter((task) => task.done);

  function deleteDoneTasks() {
    // remove() bruker setTasks(prev => ...), så flere kall på rad går fint.
    doneTasks.forEach((task) => remove(task.id));
  }

  return (
    <Screen>
      <Card title="Kun for admin">
        <Text style={styles.text}>
          Innlogget som {user?.firstName} {user?.lastName} ({user?.role}).
        </Text>
        <Text style={styles.muted}>
          Vanlige brukere ser ikke lenken hit, og åpner de /admin direkte,
          sender Stack.Protected dem til forsiden.
        </Text>
      </Card>

      <Card title="Oppgaver">
        <Text style={styles.text}>
          {tasks.length} totalt, {doneTasks.length} fullført
        </Text>
        <Button
          label="Slett alle fullførte"
          onPress={deleteDoneTasks}
          disabled={doneTasks.length === 0}
          danger
        />
      </Card>

      <Card title="Prøv beskyttelsen">
        <Text style={styles.muted}>
          Bytt til en vanlig bruker mens du står her. Når den nye brukeren er
          hentet, blir guard false, og du sendes ut av /admin automatisk.
        </Text>
        <Button label="Bytt til vanlig bruker" onPress={() => loginAs("user")} />
      </Card>
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
});
