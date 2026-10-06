import { z } from "zod";

/* =========================================================================
 * VALIDERING (Zod)
 *
 * Flyttet hit fra worker.tsx, så alt som handler om oppgaver ligger i
 * features/tasks. Tabellen selv (`tasks`) ligger fortsatt i src/db/schema,
 * fordi drizzle-kit leser migrasjoner derfra.
 *
 * To slags skjema, to forskjellige jobber:
 *
 *   src/db/schema/task-schema.ts   hvordan dataene LAGRES (Drizzle)
 *   denne fila                      hva vi GODTAR utenfra (Zod)
 *
 * Aldri send `await request.json()` rett inn i databasen. Da bestemmer den som
 * sender forespørselen hvilke kolonner som skrives, og kan finne på å sette
 * `id` eller `createdAt` selv. Zod plukker ut FELTENE VI TILLATER, og kaster
 * resten.
 *
 * Skjemaet svarer bare på FORMEN: er det tekst, er det en dato. Om innholdet
 * er LOVLIG (tom tittel, for lang, frist i fortiden) avgjør validateTask i
 * validate-task.ts, uten Zod. Da står reglene og testene deres i ren
 * TypeScript, og servicen kjører begge: først formen, så regelen.
 *
 * `userId` står med vilje IKKE her. Hvem som eier oppgaven, tar vi fra
 * ctx.user. Lar vi klienten sende den, kan hvem som helst lage oppgaver i
 * andres navn.
 * ====================================================================== */
export const createTaskSchema = z.object({
  // trim() er rydding, ikke en regel: tittelen lagres uten mellomrom rundt.
  // Tom og for lang sjekkes i validateTask.
  title: z.string("title må være tekst").trim(),
  completed: z.boolean().optional(),
  dueDate: z.coerce.date().optional(), // "2026-10-01" blir til en Date
});

// PUT gjenbruker samme regler, men alt er valgfritt: send bare det du endrer.
export const updateTaskSchema = createTaskSchema.partial();

// Typene utledes FRA skjemaet, så de kan aldri komme i utakt med reglene.
// `z.infer` gir typen ETTER parsing (dueDate er en Date, ikke en streng).
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Skjemaene her gjelder det som kommer INN. Det som går UT, styres av
 * TaskDTO og toTaskDTO i task-mapper.ts.
 *
 * TANKE: Webapp-2025 lager DTO-ene som Zod-skjema også (`TaskDTOSchema`), og
 * utleder typen fra det. Hva får man da, som en vanlig TypeScript-type ikke
 * gir? (Hint: en kontrakttest som sjekker at mapperen faktisk følger
 * skjemaet mens programmet kjører.)
 */
