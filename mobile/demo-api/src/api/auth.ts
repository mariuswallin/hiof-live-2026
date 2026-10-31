// STEG 2A: NY - innlogging mot webappen.
// app/login.tsx -> contexts/AuthContext.tsx (login) -> HER -> POST /api/v1/login
// Tokenet brukes i api/tasks.ts (Authorization-headeren).

import { z } from "zod";
import { BASE_URL } from "./tasks";

// STEG 2A: brukeren slik webappen sender den. Rollen kommer fra SERVEREN -
// appen bestemmer den aldri selv.
export const ApiUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "user"]),
});

export type ApiUser = z.infer<typeof ApiUserSchema>;

// POST /api/v1/login i webapp/tasks. Svarer med brukeren og et token som vi
// sender med på alle kall etterpå (se api/tasks.ts).
//
// STEG 2A: JUKS, som i webappen (session.ts): ingen passord, og tokenet er
// bare bruker-id-en ("2"). Poenget er det som skjer ETTER innloggingen.
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

  return z
    .object({ data: z.object({ token: z.string(), user: ApiUserSchema }) })
    .parse(json).data;
}
