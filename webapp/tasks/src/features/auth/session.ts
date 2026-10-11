import type { Role, SessionUser } from "./auth-types";
import { isDemoUserKey, toSessionUser, type DemoUserKey } from "./demo-users";
import { sign, unsign } from "./sign";

/**
 * SESJONEN: hvem du er, husket i en cookie som SERVEREN setter.
 *
 * HTTP husker ingenting. Hver forespørsel er ny, og serveren vet ikke at den
 * forrige kom fra samme nettleser. En cookie løser det:
 *
 *   POST /login                         nettleseren sender skjemaet
 *     <- Set-Cookie: session=kari:admin.9f2c…   "husk denne"
 *
 *   GET /tasks
 *     -> Cookie: session=kari:admin.9f2c…       sendes med, HVER gang
 *
 * Rene funksjoner uten rwsdk og uten database. Hemmeligheten kommer inn som
 * argument, så alt her kan testes med Vitest på millisekunder.
 *
 * To ting gjør at vi kan stole på det som kommer tilbake:
 *
 *   1. Serveren setter den, med HttpOnly. JavaScript kan ikke røre den.
 *   2. Verdien er signert (sign.ts). Klienten kan ikke endre den.
 *
 * Skrev nettleseren cookien selv (document.cookie = "session=kari:admin"),
 * ville klienten bestemt hvem den var.
 *
 * TANKE: Rollen ligger i cookien. Gjør vi Kari om fra admin til vanlig bruker,
 * er hun fortsatt admin til cookien går ut. En ekte app legger bare en
 * tilfeldig sesjons-id i cookien, og slår opp bruker og rolle i databasen på
 * hver forespørsel. Hva koster det, og hva vinner vi?
 */
export const SESSION_COOKIE = "session";

/** Én time, i sekunder. Etter det må du logge inn på nytt. */
export const SESSION_MAX_AGE = 60 * 60;

/** Det cookien bærer: HVEM, og med hvilken rolle. Ingenting annet. */
export type Session = { user: DemoUserKey; role: Role };

type CookieOptions = {
  /** Bare over HTTPS. Av lokalt, der vi kjører http://localhost. */
  secure: boolean;
};

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
function serializeCookie(value: string, maxAge: number, { secure }: CookieOptions) {
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
export async function createSessionCookie(
  session: Session,
  { secret, ...options }: CookieOptions & { secret: string },
) {
  // SIGNERING, linje 1 av 2. Uten:  const value = `${session.user}:${session.role}`;
  const value = await sign(`${session.user}:${session.role}`, secret);

  return serializeCookie(value, SESSION_MAX_AGE, options);
}

/**
 * Utlogging. En cookie kan ikke slettes fra serveren, men vi kan sende den
 * samme cookien på nytt med Max-Age=0. Da kaster nettleseren den selv.
 */
export function clearSessionCookie(options: CookieOptions) {
  return serializeCookie("", 0, options);
}

/**
 * Fra forespørsel til bruker, eller `null`.
 *
 *   ingen cookie            -> null (ikke innlogget)
 *   feil signatur           -> null (noen har endret den)
 *   ukjent bruker / rolle   -> null
 *   "kari:admin" + signatur -> Kari, som admin
 *
 * Alt som er rart, gir `null`. Vi gjetter aldri: en ukjent verdi blir ikke
 * til "vanlig bruker", den blir til "ikke innlogget".
 */
export async function readSession(
  request: Request,
  secret: string,
): Promise<SessionUser | null> {
  const cookie = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!cookie) return null;

  // SIGNERING, linje 2 av 2. Uten:  const value = cookie;
  const value = await unsign(cookie, secret);
  if (!value) return null;

  const [user, role, ...rest] = value.split(":");
  if (rest.length > 0 || !user || !isDemoUserKey(user)) return null;
  if (role !== "user" && role !== "admin") return null;

  return toSessionUser(user, role);
}

/**
 * Plukker én cookie ut av `Cookie`-headeren, som ser slik ut:
 *
 *   annet=1; session=kari:admin.9f2c…
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
