import type { User } from "@/db/schema";

/**
 * Typene auth-featuren deler med resten av appen.
 *
 * Rollen bor i databasen (users.role i src/db/schema/user-schema.ts), så
 * typen hentes derfra. Legger vi til en rolle der, følger TypeScript med.
 */
export type Role = User["role"];

/**
 * Det som ligger på ctx.user, og som sendes videre til nettleseren gjennom
 * <AuthProvider>. En egen type, ikke hele raden fra databasen.
 *
 * TANKE: I en ekte app har users også et hashet passord. Hva skjer hvis vi
 * legger hele raden på ctx, og sender den til klienten?
 */
export type SessionUser = {
  // Et TALL, fordi det er users.id i databasen.
  id: number;
  email: string;
  name: string;
  role: Role;
};

/**
 * Rollesjekken, ett sted. Brukes av både serveren og klienten:
 *
 *   serveren    isAdmin(ctx.user)   bestemmer om du FÅR LOV
 *   klienten    isAdmin(user)       bestemmer om du SER KNAPPEN
 *
 * Samme funksjon, to helt forskjellige jobber. Bare den første er sikkerhet.
 */
export const isAdmin = (user: SessionUser | null) => user?.role === "admin";
