import { env } from "cloudflare:workers";
import type { RequestInfo } from "rwsdk/worker";
import { z } from "zod";
import { createErrorResponse } from "@/lib/response";
import { Errors } from "@/lib/result";
import { loginSchema } from "./auth-schema";
import { clearSessionCookie, createSessionCookie } from "./session";

/**
 * CONTROLLER for innlogging: HTTP inn, Response ut. Samme rolle som
 * task-controller.ts, men uten service bak. Det finnes ingen database å spørre
 * i en jukseinnlogging, så de rene funksjonene i session.ts gjør jobben.
 *
 * Det viktige her er HVEM som setter cookien. Det er serveren, i svaret:
 *
 *   POST /login   (user=kari&admin=on)
 *     <- 303 See Other
 *        Location: /tasks
 *        Set-Cookie: session=kari:admin.9f2c…; HttpOnly; SameSite=Lax; …
 *
 * Åpne Network-fanen i DevTools og se på akkurat det svaret. Nettleseren
 * lagrer cookien, følger Location, og sender cookien med på GET /tasks.
 *
 * 303 betyr "det gikk bra, hent DENNE siden med GET". Uten redirect ville
 * F5 etter innlogging sendt skjemaet en gang til.
 */

// Secure-flagget krever HTTPS, og lokalt kjører vi http://localhost.
const secure = !import.meta.env.VITE_IS_DEV_SERVER;

const redirectWithCookie = (location: string, cookie: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: location, "Set-Cookie": cookie },
  });

export const authController = {
  /**
   * GET /api/me  200 OK
   *
   * Hvem tror serveren at jeg er? Svarer `{ user: null }` uten innlogging.
   */
  me({ ctx }: RequestInfo) {
    return Response.json({ user: ctx.user });
  },

  /**
   * POST /login  303 / 400
   *
   * Et helt vanlig HTML-skjema, ingen JavaScript. Nettleseren sender feltene
   * som `application/x-www-form-urlencoded`, og `formData()` leser dem.
   */
  async login({ request }: RequestInfo) {
    // Kaster hvis bodyen ikke er et skjema, for eksempel JSON.
    const form = await request.formData().catch(() => null);
    if (!form) {
      return createErrorResponse({
        code: Errors.BAD_REQUEST,
        message: "Forventet skjemadata",
      });
    }

    const parsed = loginSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      return createErrorResponse({
        code: Errors.BAD_REQUEST,
        message: "Ugyldig innlogging",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      });
    }

    // JUKS: rollen kommer fra en avkryssingsboks. I en ekte app har vi nå
    // sjekket passordet, og rollen leses fra databasen.
    const cookie = await createSessionCookie(
      { user: parsed.data.user, role: parsed.data.admin ? "admin" : "user" },
      { secret: env.SESSION_SECRET, secure },
    );

    return redirectWithCookie("/tasks", cookie);
  },

  /**
   * POST /logout  303
   *
   * POST, ikke GET. En GET skal aldri endre noe. Var utlogging en lenke,
   * kunne en annen nettside logget deg ut med `<img src=".../logout">`.
   */
  logout() {
    return redirectWithCookie("/", clearSessionCookie({ secure }));
  },
};
