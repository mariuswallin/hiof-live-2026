"use server";

import { requestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * En SERVER ACTION.
 *
 * `"use server"` MÅ stå på linje 1, på samme måte som `"use client"`. Da blir
 * hver eksporterte funksjon i fila et endepunkt: klienten importerer den som
 * en helt vanlig funksjon, men kallet går over nettet, og koden kjører aldri
 * i nettleseren.
 *
 * Det betyr to ting dere må ha i hodet:
 *
 *   1. Argumentene kommer utenfra. De må valideres, akkurat som en body i
 *      en API-rute.
 *   2. Mellomvaren i worker.tsx vokter RUTER. En server action er en egen
 *      inngang, og må sjekke innlogging selv. Det er en klassisk glipp:
 *      API-et er låst, men handlingen ved siden av står på vidt gap.
 *
 * `requestInfo` gir tilgang til den samme `ctx` som mellomvaren fylte.
 */
export async function toggleTaskCompleted(id: string, completed: boolean) {
  const { ctx } = requestInfo;

  // Samme sjekk som `requireUser`, men her inne. Se punkt 2 over.
  if (!ctx.user) {
    return { ok: false as const, error: "Du må være innlogget for å endre" };
  }

  if (typeof id !== "string" || typeof completed !== "boolean") {
    return { ok: false as const, error: "Ugyldige argumenter" };
  }

  const task = await db
    .update(tasks)
    .set({ completed })
    .where(eq(tasks.id, id))
    .returning()
    .get();

  if (!task) {
    return { ok: false as const, error: `Fant ingen oppgave med id ${id}` };
  }

  // Det som returneres må kunne serialiseres. Et vanlig objekt går fint.
  return { ok: true as const, task };
}
