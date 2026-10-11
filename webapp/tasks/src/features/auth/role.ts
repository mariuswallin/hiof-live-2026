import type { SessionUser } from "./auth-types";

/**
 * Ren rollesjekk. Ingen rwsdk, ingen cookies, ingen database.
 *
 * Ligger i sin egen fil fordi BÅDE serveren (middleware.ts) og klienten
 * (AuthProvider.tsx) bruker den. middleware.ts leser hemmeligheter fra
 * `cloudflare:workers`, og den importen kan ikke sendes til nettleseren.
 *
 *   serveren    isAdmin(ctx.user)   bestemmer om du FÅR LOV
 *   klienten    isAdmin(user)       bestemmer om du SER KNAPPEN
 *
 * Samme funksjon, to helt forskjellige jobber. Bare den første er sikkerhet.
 */
export const isAdmin = (user: SessionUser | null) => user?.role === "admin";
