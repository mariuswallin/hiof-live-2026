import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { fetchUser } from "@/api/dummy-json";
import { Card } from "@/components/shared/Card";
import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";

/**
 * "/tasks/user/[userId]" - tredje nivå i Stacken: liste -> detalj -> eier.
 *
 * userId kom fra API-svaret på detaljsiden og ble sendt hit via Link-params.
 *
 * Her henter vi med TanStack Query i stedet for useEffect. Sammenlign med
 * RemoteTodo i [id].tsx:
 *
 *   useEffect                        useQuery
 *   ---------                        --------
 *   useState for data + feil         ferdig: data, isPending, error
 *   AbortController selv             signal gis til queryFn automatisk
 *   henter på nytt HVER gang         CACHER på queryKey - gå tilbake og inn
 *                                    igjen, så vises data med en gang
 *   ingen retry                      prøver 3 ganger ved feil
 */
export default function UserScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: user, isPending, error } = useQuery({
    // queryKey = "navnet" på dataene i cachen. Alt queryFn avhenger av
    // (her userId) MÅ være med, ellers deler to brukere samme cache-plass.
    queryKey: ["user", userId],
    queryFn: ({ signal }) => fetchUser(userId, signal),
  });

  if (isPending) {
    return (
      <Screen>
        <Loading label="Henter eier ..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Empty title="Klarte ikke å hente" hint={error.message} />
      </Screen>
    );
  }

  // Her vet TypeScript at `user` finnes - pending og error er sjekket over.
  const name = `${user.firstName} ${user.lastName}`;

  return (
    <Screen>
      <Stack.Screen options={{ title: name }} />

      <Card title="Fra API (TanStack Query)">
        <View style={styles.row}>
          <Image source={user.image} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.muted}>{user.email}</Text>
            <Text style={styles.muted}>userId: {user.id}</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.primaryLight,
  },
  info: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  name: {
    fontSize: Theme.fontSize.lg,
    fontWeight: "600",
    color: Theme.text,
  },
  muted: {
    fontSize: Theme.fontSize.sm,
    color: Theme.muted,
  },
});
