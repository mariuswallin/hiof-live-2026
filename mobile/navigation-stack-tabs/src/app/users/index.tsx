import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, View } from "react-native";

import { fetchUsers } from "@/api/dummy-json";
import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
import { UserItem } from "@/components/users/UserItem";
import { Theme } from "@/constants/theme";

/**
 * "/users" - lista over brukere, UTENFOR tabs.
 *
 * Samme oppsett som tasks/index.tsx: tre tilstander (laster -> feil -> data),
 * og en FlatList der hver rad er en <Link> til detaljsiden (UserItem).
 *
 * Forskjellen: dataene ligger ikke i en context, men hentes med useQuery
 * her. Bare denne skjermen trenger lista, så det er ingen grunn til å dele
 * den - og TanStack Query cacher den uansett.
 */
export default function UsersScreen() {
  const { data: users, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: ({ signal }) => fetchUsers(signal),
  });

  if (isPending) {
    return (
      <Screen>
        <Loading label="Henter brukere ..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Empty title="Klarte ikke å hente brukere" hint={error.message} />
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
