/**
 * FORRETNINGSREGLENE for en oppgave. Ren TypeScript, ingen Zod.
 *
 * To spørsmål, to steder:
 *
 *   task-schema.ts     FORMEN     er `title` en streng, er `dueDate` en dato?
 *   denne fila         REGELEN    er innholdet lovlig?
 *
 * Zod kjører først og sørger for at typene stemmer. Derfor kan denne fila ta
 * imot `string` og `Date`, ikke `unknown`. Bytter vi valideringsbibliotek en
 * dag, står reglene og testene urørt.
 *
 * Skrevet med TDD i tre runder, én ny oppførsel per runde. Se
 * __tests__/validate-task.test.ts.
 *
 * Svaret har samme form som `validatePost` i slidene: `{ ok: true }` eller
 * `{ ok: false, ... }`. Servicen oversetter det til et Result med feil per
 * felt, så skjemaet kan vise feilen under riktig felt.
 *
 * `now` er en parameter, ikke `new Date()` inni funksjonen. Da kan testen
 * bestemme hva "i dag" er, og testen gir samme svar hver dag.
 */
export const TITLE_MAX_LENGTH = 200;

export type TaskField = "title" | "dueDate";

export type TaskValidation =
  | { ok: true }
  | { ok: false; field: TaskField; error: string };

/**
 * Sjekker bare feltene som er med. Da kan både create (alt er med) og update
 * (bare det som endres) bruke samme funksjon.
 */
export function validateTask(
  task: { title?: string; dueDate?: Date | null },
  now: Date = new Date(),
): TaskValidation {
  if (task.title !== undefined) {
    const title = task.title.trim();
    if (title.length === 0) {
      return { ok: false, field: "title", error: "Tittel kan ikke være tom" };
    }
    if (title.length > TITLE_MAX_LENGTH) {
      return {
        ok: false,
        field: "title",
        error: `Tittel kan være maks ${TITLE_MAX_LENGTH} tegn`,
      };
    }
  }

  // Sammenlign med starten av dagen, ikke med klokkeslettet nå. "2026-10-06"
  // blir midnatt UTC, og en frist i dag skal ikke avvises fordi klokka er 09.
  if (task.dueDate && task.dueDate < startOfDayUtc(now)) {
    return {
      ok: false,
      field: "dueDate",
      error: "Fristen kan ikke være før i dag",
    };
  }

  return { ok: true };
}

const startOfDayUtc = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
