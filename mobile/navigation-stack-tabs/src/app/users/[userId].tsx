import { useQuery } from "@tanstack/react-query";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { fetchUser } from "@/api/dummy-json";
import { Card } from "@/components/shared/Card";
import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
import { UserInfo } from "@/components/users/UserInfo";
import { Theme } from "@/constants/theme";

/**
 * "/users/[userId]" - DYNAMISK rute utenfor tabs.
 *
 * Akkurat som tasks/[id].tsx: alt etter "/users/" havner i parameteren:
 *   /users/68 -> { userId: "68" }
 *
 * Forskjellen er HVOR fila ligger. tasks/[id].tsx er inne i Oppgaver-taben
 * (tab-baren står), denne er i rot-Stacken (ingen tab-bar). Prøv å åpne
 * /users/68 rett fra adressefeltet - ingen tab er involvert.
 */
export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: user, isPending, error } = useQuery({
    // SAMME queryKey som i tasks/user/[userId].tsx. Har du sett eieren av
    // en oppgave, ligger brukeren allerede i cachen - og vises med en gang
    // her, selv om skjermen ligger et helt annet sted i rutetreet.
    queryKey: ["user", userId],
    queryFn: ({ signal }) => fetchUser(userId, signal),
  });

  if (isPending) {
    return (
      <Screen>
        <Loading label="Henter bruker ..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Finnes ikke" }} />
        <Empty title="Klarte ikke å hente" hint={error.message} />
      </Screen>
    );
  }

  // URL-parametere er ALLTID strenger. Skal vi regne, må vi gjøre om selv.
  // (Er userId "abc", har API-et allerede svart 400 og vi er i feil-tilstanden.)
  const nextUserId = String(Number(userId) + 1);

  return (
    <Screen>
      {/* Dynamisk tittel: nå vet vi hvem det er. */}
      <Stack.Screen options={{ title: `${user.firstName} ${user.lastName}` }} />

      <Card title="Fra API (TanStack Query)">
        <UserInfo user={user} />
      </Card>

      <Card title="Samme fil, ny parameter">
        <Text style={styles.muted}>
          Lenken under åpner [userId].tsx på nytt, med en annen userId. push
          legger den OPPÅ denne, så «tilbake» går til forrige bruker.
        </Text>
        <Link
          push
          href={{ pathname: "/users/[userId]", params: { userId: nextUserId } }}
          style={styles.link}
        >
          Neste bruker ({nextUserId}) →
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: Theme.fontSize.sm,
    color: Theme.muted,
  },
  link: {
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Theme.primary,
  },
});
