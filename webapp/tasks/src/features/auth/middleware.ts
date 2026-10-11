import { env } from "cloudflare:workers";
import type { RouteMiddleware } from "rwsdk/router";
import { createErrorResponse } from "@/lib/response";
import { isAdmin } from "./role";
import { readSession } from "./session";

/* =========================================================================
 * MELLOMVARE OG INTERRUPTERS
 *
 * En mellomvare er en funksjon som kjører FØR handleren. Den får hele
 * `requestInfo` (ikke bare ctx), og har to valg:
 *
 *   returner ingenting  -> forespørselen går videre til neste ledd
 *   returner en Response -> kjeden stopper her, og dette blir svaret
 *
 * Det siste er hele poenget: en vakt slipper deg enten forbi, eller svarer
 * selv. Returnerer du noe annet enn en Response, for eksempel `true` eller
 * `false`, skjer det INGENTING, og alle slipper inn.
 *
 * Samme slags funksjon brukes på to måter, og det er HVOR den står som
 * avgjør:
 *
 *   mellomvare    i defineApp([...])           kjører for ALLE forespørsler
 *                 setUser                      "hvem er du?"
 *
 *   interrupter   i route(path, [vakt, side])  kjører for ÉN rute
 *                 requireUser, requireAdmin,   "får du lov?"
 *                 requireUserPage
 *
 * worker.tsx skal bare koble sammen; HVORDAN vi finner brukeren er
 * auth-featuren sitt ansvar.
 * ====================================================================== */

/**
 * Finner ut hvem som spør, og legger brukeren på ctx.  (autentisering)
 *
 * Leser cookien `session`, sjekker signaturen og gjør den om til en bruker.
 * Ingen cookie, eller en cookie noen har tuklet med, gir `null`.
 *
 * Må stå FØR rutene i defineApp, ellers er ctx.user tom når vaktene under
 * skal sjekke den.
 */
export const setUser: RouteMiddleware = async ({ ctx, request }) => {
  ctx.user = await readSession(request, env.SESSION_SECRET);
};

/**
 * Krever at noen er innlogget.  401 Unauthorized
 *
 * 401 betyr "jeg vet ikke hvem du er". Det er ikke det samme som 403.
 */
export const requireUser: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return createErrorResponse({
      code: "UNAUTHORIZED",
      message: "Du må være innlogget. Logg inn på /login",
    });
  }
};

/**
 * Krever at den innloggede er admin.  403 Forbidden
 *
 * 403 betyr "jeg VET hvem du er, og du får likevel ikke lov". Derfor må den
 * returnere en Response, ikke en boolean: en boolean stopper ingenting.
 *
 * Sjekker innlogging selv også, så den virker alene: `[requireAdmin, handler]`.
 */
export const requireAdmin: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return createErrorResponse({
      code: "UNAUTHORIZED",
      message: "Du må være innlogget",
    });
  }

  if (!isAdmin(ctx.user)) {
    return createErrorResponse({
      code: "FORBIDDEN",
      message: `${ctx.user.email} er ikke admin`,
    });
  }
};

/**
 * Samme sjekk som requireUser, men for SIDER.  302 Found -> /login
 *
 * Et API svarer 401 med JSON, og lar klienten bestemme hva som skjer videre.
 * Et menneske som har klikket på en lenke, skal ikke få JSON i fjeset: det
 * skal til innloggingssiden.
 *
 *   route("/api/tasks", { post: [requireUser, ...] })     401 + JSON
 *   route("/profile", [requireUserPage, ProfilePage])     302 -> /login
 *
 * TANKE: Etter innlogging havner du på /tasks, ikke på siden du prøvde å
 * åpne. Hvordan ville du husket hvor brukeren var på vei? (Hint:
 * /login?next=/profile. Og hva må du sjekke før du sender noen videre til en
 * adresse som kommer fra URL-en?)
 */
export const requireUserPage: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
};
