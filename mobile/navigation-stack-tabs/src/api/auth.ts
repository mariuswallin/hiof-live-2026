import { z } from "zod";

import { UserSchema } from "@/api/dummy-json";

/**
 * Innlogget bruker = vanlig bruker + ROLLE. Rollen bestemmer hva brukeren
 * får se (f.eks. /admin). z.enum gir oss både sjekken og typen
 * "admin" | "user".
 */
export const RoleSchema = z.enum(["admin", "user"]);

export type Role = z.infer<typeof RoleSchema>;

export const AuthUserSchema = UserSchema.extend({ role: RoleSchema });

export type AuthUser = z.infer<typeof AuthUserSchema>;

/** "Databasen" på serveren: én konto per rolle. */
const ACCOUNTS: Record<Role, unknown> = {
  user: {
    id: 1,
    firstName: "Ola",
    lastName: "Nordmann",
    email: "ola.nordmann@hiof.no",
    image: "https://dummyjson.com/icon/olanordmann/128",
    role: "user",
  },
  admin: {
    id: 2,
    firstName: "Kari",
    lastName: "Admin",
    email: "kari.admin@hiof.no",
    image: "https://dummyjson.com/icon/kariadmin/128",
    role: "admin",
  },
};

/**
 * Hvem er logget inn på denne enheten?
 *
 * I en ekte app: en TOKEN fra innloggingen, lagret i expo-secure-store - den
 * overlever refresh. Her: en vanlig variabel i JS-minnet. Etter en refresh er
 * du derfor tilbake til standardkontoen (Ola, vanlig bruker).
 */
let loggedInAs: Role = "user";

/** Simulert innlogging. Ekte app: POST /login -> ny token -> lagre den. */
export function simulateLogin(role: Role) {
  loggedInAs = role;
}

/**
 * SIMULERT "hvem er jeg?"-kall - i et ekte API typisk GET /me, med tokenen i
 * headeren:
 *
 *   fetch(`${BASE_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
 *
 * Serveren slår opp tokenen og svarer med brukeren - INKLUDERT rollen. Appen
 * bestemmer aldri rollen selv, den får den fra API-et.
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  // Se i terminalen/konsollen: denne linjen kommer ved OPPSTART og REFRESH,
  // men IKKE når du bytter tab, åpner detaljsiden eller "ny oppgave".
  console.log("[auth] Henter innlogget bruker fra API ...");

  // Lat som nettverket bruker litt tid, så vi ser laster-tilstanden.
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Data "fra nettet" valideres før vi stoler på det - også når det er
  // simulert. Feil rolle (f.eks. "superadmin") ville kastet her.
  return AuthUserSchema.parse(ACCOUNTS[loggedInAs]);
}
