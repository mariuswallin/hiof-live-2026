import { UserSchema, type User } from "@/api/dummy-json";

/**
 * SIMULERT "hvem er jeg?"-kall - i et ekte API typisk GET /me, med en token
 * i headeren:
 *
 *   fetch(`${BASE_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
 *
 * Her later vi bare som: vent litt (nettverk tar tid) og returner en fast
 * bruker. Bytt ut innholdet med et ekte kall senere - AuthProvider og
 * skjermene merker ingen forskjell, de ser bare et Promise<User>.
 */
export async function fetchCurrentUser(): Promise<User> {
  // Se i terminalen/konsollen: denne linjen kommer ved OPPSTART og REFRESH,
  // men IKKE når du bytter tab, åpner detaljsiden eller modalen.
  console.log("[auth] Henter innlogget bruker fra API ...");

  // Lat som nettverket bruker litt tid, så vi ser laster-tilstanden.
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Samme zod-skjema som de ekte dummyjson-brukerne. Data "fra nettet"
  // valideres før vi stoler på det - også når det er simulert.
  return UserSchema.parse({
    id: 1,
    firstName: "Ola",
    lastName: "Nordmann",
    email: "ola.nordmann@hiof.no",
    image: "https://dummyjson.com/icon/olanordmann/128",
  });
}
