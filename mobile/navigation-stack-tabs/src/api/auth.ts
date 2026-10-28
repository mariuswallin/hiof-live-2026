import { z } from "zod";

import { BASE_URL } from "@/api/tasks";

/**
 * Innlogget bruker slik webappen sender den: id, navn, e-post og ROLLE.
 * Rollen bestemmer hva brukeren får se (f.eks. /admin). z.enum gir oss både
 * sjekken og typen "admin" | "user".
 *
 * Appen bestemmer aldri rollen selv - den kommer fra webappen.
 */
export const ApiUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "user"]),
});

export type ApiUser = z.infer<typeof ApiUserSchema>;

/**
 * INNLOGGING: POST /api/v1/login i webapp/tasks, med { userId } i body.
 *   200 -> { ok: true,  data: { token, user } }
 *   400 -> { ok: false, error: { message, ... } }   f.eks. ukjent bruker
 *
 * Tokenet sender vi med på alle kall etterpå (se api/tasks.ts). Webappen
 * slår opp brukeren fra tokenet - INKLUDERT rollen.
 *
 * USIKKERT: ingen passord, og tokenet er bare bruker-id-en (jukseauth i
 * webappen, se readBearerUserId i session.ts). Ekte app: e-post + passord
 * inn, et signert eller tilfeldig token ut.
 */
export async function login(
  userId: number,
): Promise<{ token: string; user: ApiUser }> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json.error?.message ?? `Kunne ikke logge inn (${response.status})`,
    );
  }

  // Data "fra nettet" valideres før vi stoler på det. Feil rolle (f.eks.
  // "superadmin") ville kastet her.
  return z
    .object({ data: z.object({ token: z.string(), user: ApiUserSchema }) })
    .parse(json).data;
}
