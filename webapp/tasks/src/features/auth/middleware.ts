import type { RouteMiddleware } from "rwsdk/router";
import type { SessionUser } from "./auth-types";
import { getDemoUserFromRequest } from "./demo-user";

/* =========================================================================
 * MELLOMVARE
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
 * Flyttet hit fra worker.tsx. worker.tsx skal bare koble sammen; HVORDAN vi
 * finner brukeren er auth-featuren sitt ansvar.
 * ====================================================================== */

/** Ren sjekk, gjenbrukes i mellomvaren, i server actions og i UI-et. */
export const isAdmin = (user: SessionUser | null) => user?.role === "admin";

/**
 * Finner ut hvem som spør, og legger brukeren på ctx.
 *
 * Må stå FØR rutene i defineApp, ellers er ctx.user tom når vaktene under
 * skal sjekke den.
 */
export const setUser: RouteMiddleware = ({ ctx, request }) => {
  ctx.user = getDemoUserFromRequest(request);
};

/**
 * Krever at noen er innlogget.  401 Unauthorized
 *
 * 401 betyr "jeg vet ikke hvem du er". Det er ikke det samme som 403.
 */
export const requireUser: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return Response.json(
      { error: "Du må være innlogget. Prøv: -H 'x-demo-user: admin'" },
      { status: 401 },
    );
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
    return Response.json({ error: "Du må være innlogget" }, { status: 401 });
  }

  if (!isAdmin(ctx.user)) {
    return Response.json(
      { error: `${ctx.user.email} er ikke admin` },
      { status: 403 },
    );
  }
};
