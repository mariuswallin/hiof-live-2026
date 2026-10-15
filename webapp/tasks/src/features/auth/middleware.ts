import type { RouteMiddleware } from "rwsdk/router";
import { db } from "@/db";
import { isAdmin } from "./auth-types";
import { readSessionUserId } from "./session";

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
 * Svarene har samme form som resten av API-et (se task-controller.ts):
 *
 *   { ok: false, error: { code: "401", message: "...", fieldErrors: {} } }
 * ====================================================================== */

/**
 * Finner ut hvem som spør, og legger brukeren på ctx.  (autentisering)
 *
 * Cookien `session` bærer bare id-en. Resten, også ROLLEN, slås opp i
 * databasen på hver forespørsel. Gjør vi en admin om til vanlig bruker i
 * databasen, gjelder det fra neste klikk.
 *
 * Må stå FØR rutene i defineApp, ellers er ctx.user tom når vaktene under
 * skal sjekke den.
 *
 * FORENKLET: spørringen står rett her. I en ekte app ligger den i et
 * auth-repository, som i tasks-featuren.
 */
export const setUser: RouteMiddleware = async ({ ctx, request }) => {
  const userId = readSessionUserId(request);

  if (!userId) {
    ctx.user = null;
    return;
  }

  // `columns` plukker bare feltene vi vil ha på ctx (se SessionUser).
  const user = await db.query.users.findFirst({
    where: { id: userId },
    columns: { id: true, name: true, email: true, role: true },
  });

  // Finnes ikke brukeren (lenger), er du ikke innlogget.
  ctx.user = user ?? null;
};

/**
 * Krever at noen er innlogget.  401 Unauthorized
 *
 * 401 betyr "jeg vet ikke hvem du er". Det er ikke det samme som 403.
 */
export const requireUser: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "401",
          message: "Du må være innlogget. Logg inn på /login",
          fieldErrors: {},
        },
      },
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
    return Response.json(
      {
        ok: false,
        error: {
          code: "401",
          message: "Du må være innlogget",
          fieldErrors: {},
        },
      },
      { status: 401 },
    );
  }

  if (!isAdmin(ctx.user)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "403",
          message: `${ctx.user.email} er ikke admin`,
          fieldErrors: {},
        },
      },
      { status: 403 },
    );
  }
};

/**
 * Samme sjekk som requireUser, men for SIDER.  302 Found -> /login
 *
 * Et API svarer 401 med JSON, og lar klienten bestemme hva som skjer videre.
 * Et menneske som har klikket på en lenke, skal ikke få JSON i fjeset: det
 * skal til innloggingssiden.
 *
 *   route("/api/v1/tasks", { get: [requireUser, ...] })   401 + JSON
 *   route("/tasks", [requireUserPage, TasksPage])         302 -> /login
 *
 * TANKE: Etter innlogging havner du alltid på /tasks. Hvordan ville du husket
 * hvor brukeren var på vei? (Hint: /login?next=/tasks. Og hva må du sjekke før
 * du sender noen videre til en adresse som kommer fra URL-en?)
 */
export const requireUserPage: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
};
