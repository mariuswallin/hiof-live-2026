import type { Role, SessionUser } from "./auth-types";

/**
 * Brukerne du kan logge inn som. Jukseinnlogging: ingen passord, du velger
 * bare hvem du er på /login.
 *
 * Id-ene MÅ finnes i `users`-tabellen, fordi tasks.user_id er en
 * fremmednøkkel. Derfor leser seeden (src/db/seed.ts) den samme lista: legger
 * du til en bruker her, havner den i databasen neste gang du kjører
 * `npm run seed`.
 *
 * Rollen står IKKE her. Den velger du i skjemaet, så samme bruker kan prøves
 * som både "user" og "admin".
 *
 * TANKE: I en ekte app ligger brukerne i databasen, med et hashet passord, og
 * rollen i en kolonne (users.role). Hva er det farlige med å la den som logger
 * inn velge rollen selv?
 */
export const DEMO_USER_KEYS = ["kari", "ola"] as const;

export type DemoUserKey = (typeof DEMO_USER_KEYS)[number];

export const DEMO_USERS: Record<DemoUserKey, Omit<SessionUser, "role">> = {
  kari: { id: 1, name: "Kari Nordmann", email: "kari@example.com" },
  ola: { id: 2, name: "Ola Hansen", email: "ola@example.com" },
};

/** Er dette en bruker vi kjenner? Alt annet avvises (allowlist). */
export const isDemoUserKey = (value: string): value is DemoUserKey =>
  DEMO_USER_KEYS.some((key) => key === value);

/** Bruker + rolle = det som havner på ctx.user. */
export const toSessionUser = (key: DemoUserKey, role: Role): SessionUser => ({
  ...DEMO_USERS[key],
  role,
});
