import { Errors, ResultHandler, type Result, type ResultError } from "@/lib/result";
import type { TaskDTO } from "./task-mapper";

/**
 * API-KLIENT: den "gamle" måten. Vanlig fetch mot en REST-rute.
 *
 * Kjører i nettleseren (importeres fra TaskList.tsx, som er "use client").
 * Sammenlign med createTaskAction i actions.ts:
 *
 *   server action   import + kall, React tar seg av nettverket og re-render
 *   fetch           vi bygger URL, metode, leser status og body selv
 *
 * Fordelen med fetch: ruta er et ekte API. Mobilappen, Thunder Client og curl
 * kan bruke den samme ruta (se task-routes.ts).
 *
 * Cookien `demo-user` sendes med automatisk, fordi kallet går til samme
 * domene (`credentials: "same-origin"` er standard).
 *
 * TANKE: Cookies sendes med AUTOMATISK. Hva betyr det hvis en annen nettside
 * prøver å sende en DELETE hit? (Søkeord: CSRF, SameSite.)
 */
/**
 * GET /api/tasks?completed=false&q=oblig. Samme liste som TasksPage henter
 * på serveren, men via fetch:
 *
 *   TasksPage   -> parseParams -> service
 *   listTasks   -> route -> controller -> parseParams -> service
 *
 * Skrevet ut uten hjelpere: vi bygger URL-en, leser body og lager feilen selv.
 *
 * URLSearchParams lager query-strengen og koder æ, ø, å og mellomrom. Ikke
 * lim den sammen selv med `?q=${q}`: "a&limit=1" ville blitt to parametere.
 *
 *   listTasks({ completed: "false", q: "oblig" })
 *   -> GET /api/tasks?completed=false&q=oblig
 *
 * TANKE: Appen bruker ikke denne. Hva måtte TaskFilter gjort annerledes for å
 * filtrere med fetch i nettleseren, i stedet for å laste siden på nytt?
 */
export async function listTasks(
  params: Record<string, string> = {},
): Promise<Result<TaskDTO[]>> {
  const query = new URLSearchParams(params).toString();

  try {
    const response = await fetch(`/api/tasks?${query}`);

    // 200: { success: true, data: TaskDTO[] }
    // 400: { success: false, error: { code: "BAD_REQUEST", fieldErrors } }
    // Begge er allerede et Result.
    return (await response.json()) as Result<TaskDTO[]>;
  } catch {
    // fetch kaster bare ved NETTVERKSFEIL, aldri ved 4xx/5xx.
    return {
      success: false,
      error: {
        code: Errors.INTERNAL_SERVER_ERROR,
        message: "Fikk ikke kontakt med serveren",
      },
    };
  }
}

/**
 * POST /api/tasks. Samme jobb som createTaskAction, men via fetch.
 *
 * Appen lager oppgaver med server actionen. Denne står her for å vise den
 * andre veien gjennom de samme lagene:
 *
 *   createTaskAction  -> service
 *   createTask        -> route -> requireUser -> controller -> service
 *
 * Validering og tilgang er like, fordi begge ender i servicen. Svaret er
 * også likt: en TaskDTO, eller en feil med `fieldErrors`.
 *
 * Merk det fetch IKKE gjør: React vet ikke at noe er endret. Vil du se den
 * nye oppgaven i lista, må du kalle navigate() selv, slik handleDelete gjør.
 *
 * TANKE: Bytt createTaskAction ut med denne i TaskList. Hva må du skrive selv
 * som useActionState ga deg gratis?
 */
export async function createTask(input: {
  title: string;
  dueDate?: string;
}): Promise<Result<TaskDTO>> {
  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });

    // 201: body er { success: true, data: TaskDTO }. Feil har samme form som
    // for DELETE. Begge er allerede et Result, så vi sender det rett videre.
    return (await response.json()) as Result<TaskDTO>;
  } catch {
    return ResultHandler.failure(
      "Fikk ikke kontakt med serveren",
      Errors.INTERNAL_SERVER_ERROR,
    );
  }
}

export async function deleteTask(id: string): Promise<Result<void>> {
  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    // 204: alt gikk bra, og det finnes ingen body å lese.
    if (response.ok) return ResultHandler.success(undefined);

    // Feil fra API-et har alltid formen { success: false, error: {...} }.
    const body = (await response.json()) as { error: ResultError };
    return { success: false, error: body.error };
  } catch {
    // fetch kaster bare ved NETTVERKSFEIL, aldri ved 4xx/5xx.
    return ResultHandler.failure(
      "Fikk ikke kontakt med serveren",
      Errors.INTERNAL_SERVER_ERROR,
    );
  }
}
