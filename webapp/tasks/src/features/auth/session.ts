/**
 * SESJONEN: hvem du er, husket i en cookie som SERVEREN setter.
 *
 * HTTP husker ingenting. Hver forespørsel er ny, og serveren vet ikke at den
 * forrige kom fra samme nettleser. En cookie løser det:
 *
 *   POST /login                      nettleseren sender skjemaet
 *     <- Set-Cookie: session=2               "husk denne"
 *
 *   GET /tasks
 *     -> Cookie: session=2                   sendes med, HVER gang
 *
 * Cookien bærer bare id-en til brukeren. Navn og rolle slår serveren opp i
 * databasen (setUser i middleware.ts), så de kan ikke endres fra klienten.
 *
 * Rene funksjoner uten rwsdk og uten database, så de kan testes med Vitest.
 *
 * FORENKLET: verdien er IKKE signert. HttpOnly stopper JavaScript på siden
 * fra å lese cookien, men ingenting stopper noen fra å sende sin egen:
 *
 *   curl localhost:5173/api/v1/tasks -H "Cookie: session=1"
 *
 * En ekte app løser det på én av to måter:
 *
 *   1. Signering. Serveren regner ut en signatur av verdien, med en
 *      hemmelighet bare den kjenner, og henger den på: 2.9f2c…
 *      Endrer noen verdien, stemmer ikke signaturen lenger. Dette er ikke
 *      kryptering: verdien kan fortsatt leses, men ikke endres.
 *
 *   2. Sesjons-id. Cookien bærer en lang, tilfeldig id i stedet for
 *      bruker-id-en. Serveren slår den opp i en egen tabell, og kan slette
 *      raden for å logge deg ut overalt. Det er dette better-auth gjør.
 */
export const SESSION_COOKIE = "session";

/** Én time, i sekunder. Etter det må du logge inn på nytt. */
export const SESSION_MAX_AGE = 60 * 60;

/**
 * Bygger verdien til `Set-Cookie`. Attributtene er halve sikkerheten:
 *
 *   HttpOnly       JavaScript får ikke lese den (document.cookie). Klarer noen
 *                  å kjøre kode på siden (XSS), får de ikke med seg sesjonen
 *   SameSite=Lax   sendes ikke med når ANDRE nettsteder poster skjema eller
 *                  kaller fetch hit (CSRF)
 *   Path=/         gjelder alle ruter
 *   Max-Age        sekunder til nettleseren kaster den. 0 betyr "slett nå"
 *   Secure         sendes bare over HTTPS
 */
function serializeCookie(value: string, maxAge: number) {
  // Lokalt kjører vi http://localhost, og da må Secure være av.
  const secure = !import.meta.env.VITE_IS_DEV_SERVER;

  return [
    `${SESSION_COOKIE}=${value}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

/** Innlogging: cookien nettleseren skal ta vare på. */
export function createSessionCookie(userId: number) {
  return serializeCookie(String(userId), SESSION_MAX_AGE);
}

/**
 * Utlogging. En cookie kan ikke slettes fra serveren, men vi kan sende den
 * samme cookien på nytt med Max-Age=0. Da kaster nettleseren den selv.
 */
export function clearSessionCookie() {
  return serializeCookie("", 0);
}

/**
 * Fra forespørsel til bruker-id, eller `null`.
 *
 *   ingen cookie        -> null (ikke innlogget)
 *   "abc", "-1", "1.5"  -> null
 *   "2"                 -> 2
 *
 * Alt som er rart, gir `null`. Om id-en faktisk finnes, vet vi først når
 * setUser har spurt databasen.
 */
export function readSessionUserId(request: Request): number | null {
  const value = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!value || !/^\d+$/.test(value)) return null;

  const userId = Number(value);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}

/**
 * Plukker én cookie ut av `Cookie`-headeren, som ser slik ut:
 *
 *   annet=1; session=2
 */
export function readCookie(cookieHeader: string | null, name: string) {
  for (const part of cookieHeader?.split(";") ?? []) {
    const index = part.indexOf("=");
    if (index === -1 || part.slice(0, index).trim() !== name) continue;

    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      // Ugyldig %-koding. Headeren kommer utenfra, og skal aldri velte serveren.
      return undefined;
    }
  }

  return undefined;
}
