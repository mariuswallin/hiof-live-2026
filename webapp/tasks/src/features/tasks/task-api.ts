import { Errors, ResultHandler, type Result, type ResultError } from "@/lib/result";

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
