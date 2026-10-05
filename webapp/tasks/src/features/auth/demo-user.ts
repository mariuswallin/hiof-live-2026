import type { SessionUser } from "./auth-types";

/**
 * Juksepålogging, kun for demoen. Rene funksjoner uten rwsdk og uten
 * database, så de kan testes med Vitest på millisekunder.
 *
 * Hvem som spør, leses fra én av to kilder:
 *
 *   headeren `x-demo-user`   praktisk i curl og Thunder Client
 *   cookien  `demo-user`     praktisk i nettleseren (se DemoUserPanel.tsx)
 *
 * Headeren vinner hvis begge er satt.
 *
 * TANKE: Alt her kommer fra KLIENTEN. Hvem som helst kan skrive
 * `demo-user=admin` i en cookie og bli admin. En ekte innlogging setter en
 * SIGNERT cookie fra serveren (eller en sesjons-id som slås opp i databasen),
 * slik at klienten ikke kan endre innholdet. Det er det better-auth gjør.
 */
export const DEMO_USER_COOKIE = "demo-user";
export const DEMO_USER_HEADER = "x-demo-user";

/**
 * De kjente demobrukerne. `satisfies` sjekker at hver verdi er en gyldig
 * SessionUser, men beholder de konkrete nøklene ("admin" | "bruker") i typen.
 *
 * Begge har id 1, altså brukeren seeden lager. Fremmednøkkelen på
 * tasks.user_id krever at id-en finnes, så en ny id her betyr en ny rad i
 * seeden også.
 */
export const DEMO_USERS = {
  admin: { id: 1, email: "admin@test.no", name: "Admin User", role: "admin" },
  bruker: {
    id: 1,
    email: "test@example.com",
    name: "Test Testesen",
    role: "user",
  },
} satisfies Record<string, SessionUser>;

export type DemoUserKey = keyof typeof DEMO_USERS;

/** Plukker én cookie ut av `cookie`-headeren. */
export function readCookie(cookieHeader: string | null, name: string) {
  const match = cookieHeader
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name);

  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/**
 *   ingenting        -> null (ikke innlogget)
 *   "admin"          -> admin
 *   hva som helst    -> vanlig bruker
 *
 * TANKE: "hva som helst -> vanlig bruker" er rausere enn det burde vært.
 * Ville det vært bedre å returnere null for ukjente verdier?
 */
export function resolveDemoUser(value: string | undefined): SessionUser | null {
  if (!value) return null;
  return value === "admin" ? DEMO_USERS.admin : DEMO_USERS.bruker;
}

/** Leser header først, så cookie, og gir tilbake brukeren (eller null). */
export function getDemoUserFromRequest(request: Request) {
  const value =
    request.headers.get(DEMO_USER_HEADER) ??
    readCookie(request.headers.get("cookie"), DEMO_USER_COOKIE);

  return resolveDemoUser(value);
}
