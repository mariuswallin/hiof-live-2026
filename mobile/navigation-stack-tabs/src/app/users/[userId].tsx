import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { getUser, type User } from "@/api/dummy-json";
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
 *
 * Hentet på den "GAMLE" måten, som users/index.tsx: useState + useEffect.
 * Ingen cache - går du tilbake og inn igjen, hentes brukeren på nytt.
 */
export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // null = ikke hentet ennå. Laster = verken user eller error er satt.
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Kjører etter første render, og på nytt hvis userId endres.
  useEffect(() => {
    const controller = new AbortController();

    getUser(userId, controller.signal)
      .then(setUser)
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Ukjent feil");
      });

    return () => controller.abort();
  }, [userId]);

  if (error) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Finnes ikke" }} />
        <Empty title="Klarte ikke å hente" hint={error} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <Loading label="Henter bruker ..." />
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

      <Card title="Fra API (useEffect)">
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
