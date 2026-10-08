import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";

import { fetchUser } from "@/api/dummy-json";
import { Card } from "@/components/shared/Card";
import { Empty } from "@/components/shared/Empty";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
import { UserInfo } from "@/components/users/UserInfo";

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
        {/* Samme visning som /users/[userId] - se components/users/UserInfo. */}
        <UserInfo user={user} />
      </Card>
    </Screen>
  );
}
