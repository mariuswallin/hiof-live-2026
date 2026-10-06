/**
 * KUNSTIG TREGHET OG TILFELDIGE FEIL. Bare for demo, bare i dev.
 *
 * Lokalt svarer D1 på et par millisekunder. Da ser vi aldri "lagrer…", aldri
 * skjelettet mens lista lastes, og aldri at useOptimistic ruller tilbake.
 * Her later vi som om nettet er tregt, og at serveren feiler av og til.
 *
 *   demoDelay(request, ms)     venter `ms` millisekunder
 *   demoFailure(request)       feiler ca. hver 3. gang (en feil, ikke throw)
 *
 * Av i produksjon (VITE_IS_DEV_SERVER finnes bare i `npm run dev`), og av når
 * forespørselen har headeren `x-demo-chaos: off`. Playwright sender den (se
 * playwright.config.ts), ellers ville e2e-testene feilet tilfeldig.
 *
 * TANKE: Hvorfor Math.random() og ikke en teller som feiler på hvert 3. kall?
 * En modulvariabel lever i ÉN worker-instans. I produksjon kjører mange
 * instanser side om side, og telleren blir tilfeldig likevel. (Se AGENTS.md.)
 */
const FAILURE_RATE = 1 / 3;

const isEnabled = (request: Request) =>
  Boolean(import.meta.env.VITE_IS_DEV_SERVER) &&
  request.headers.get("x-demo-chaos") !== "off";

export async function demoDelay(request: Request, ms: number) {
  if (!isEnabled(request)) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `null` = gå videre. Ellers en ferdig feil å returnere. Sjekk den FØR du
 * skriver til databasen, ellers er endringen lagret selv om brukeren ser feil.
 */
export function demoFailure(
  request: Request,
): { code: "INTERNAL_SERVER_ERROR"; message: string } | null {
  if (!isEnabled(request) || Math.random() >= FAILURE_RATE) return null;

  return {
    code: "INTERNAL_SERVER_ERROR",
    message: "Tilfeldig feil (demo). Prøv igjen.",
  };
}
