import type { Params } from "./parse-params";

/**
 * REGLENE for parametrene til lista. Ren TypeScript, samme form som
 * validateTask: `{ ok: true, ... }` eller `{ ok: false, field, error }`.
 *
 *   parse-params.ts          URL  -> { completed: "false", limit: "5" }   tekst
 *   denne fila               tekst -> { completed: false, limit: 5 }      typer
 *
 * Gjør to ting på én gang: tekst blir riktig type, og vi sjekker at verdien er
 * lovlig. For en query-streng er det samme spørsmål: "false" er lovlig fordi
 * den kan bli `false`, "kanskje" er ulovlig fordi den ikke kan bli noe.
 *
 * Ukjente parametere (?tull=1) ignoreres. Vi plukker bare ut de vi kjenner,
 * på samme måte som createTaskSchema bare tar feltene vi tillater.
 *
 * Tom verdi (?completed=) betyr "ikke satt". Et GET-skjema sender tomme felt
 * slik, se TaskFilter.tsx.
 */
export const LIST_LIMIT_MAX = 100;

export type TaskListParams = {
  /** Mangler: både ferdige og ikke ferdige. */
  completed?: boolean;
  /** Søk i tittelen. */
  q?: string;
  /** Mangler: alle. */
  limit?: number;
};

export type ListParamsValidation =
  | { ok: true; params: TaskListParams }
  | { ok: false; field: keyof TaskListParams; error: string };

export function validateListParams(input: Params): ListParamsValidation {
  const params: TaskListParams = {};

  // Bare "true" eller "false". Ikke Boolean(tekst): da er "false" sann.
  if (input.completed) {
    if (input.completed !== "true" && input.completed !== "false") {
      return {
        ok: false,
        field: "completed",
        error: "completed må være true eller false",
      };
    }
    params.completed = input.completed === "true";
  }

  // Fritekst. Bare mellomrom er det samme som ingenting.
  const q = input.q?.trim();
  if (q) params.q = q;

  // Number("ti") er NaN, Number("2.5") er 2.5. Begge stoppes av isInteger.
  if (input.limit) {
    const limit = Number(input.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > LIST_LIMIT_MAX) {
      return {
        ok: false,
        field: "limit",
        error: `limit må være et heltall fra 1 til ${LIST_LIMIT_MAX}`,
      };
    }
    params.limit = limit;
  }

  return { ok: true, params };
}
