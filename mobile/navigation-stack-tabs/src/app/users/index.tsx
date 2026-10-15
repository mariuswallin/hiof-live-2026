import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { listUsers, type User } from "@/api/dummy-json";
import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
import { UserItem } from "@/components/users/UserItem";
import { Theme } from "@/constants/theme";

/**
 * "/users" - lista over brukere, UTENFOR tabs.
 *
 * Hentet på den "GAMLE" måten: useState + useEffect. Vi må selv holde styr
 * på tre tilstander - laster, feil, data. (Sammenlign med tasks/, som bruker
 * use() + Suspense fra React 19.)
 *
 * Hver rad er en <Link> til detaljsiden (UserItem).
 */
export default function UsersScreen() {
  // null = ikke hentet ennå. Laster = verken users eller error er satt.
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Kjører ÉN gang etter første render (tomt dependency-array).
  useEffect(() => {
    // AbortController: går brukeren tilbake før svaret kommer, avbryter vi
    // forespørselen. Ellers kan et gammelt svar sette state på en skjerm
    // som ikke lenger finnes.
    const controller = new AbortController();

    listUsers(controller.signal)
      .then(setUsers)
      .catch((e: unknown) => {
        // Avbrudd er ikke en feil - det var vi som ba om det.
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Ukjent feil");
      });

    // Opprydding: kjøres når skjermen forsvinner.
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <Screen>
        <Empty title="Klarte ikke å hente brukere" hint={error} />
      </Screen>
    );
  }

  if (!users) {
    return (
      <Screen>
        <Loading label="Henter brukere ..." />
      </Screen>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(user) => String(user.id)}
      renderItem={({ item }) => <UserItem user={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  // Samme luft som TaskList.
  content: {
    padding: Theme.spacing.lg,
  },
  separator: {
    height: Theme.spacing.sm,
  },
});
