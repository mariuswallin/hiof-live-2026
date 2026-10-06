import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";
import { db } from "@/db";
import type { SessionUser } from "@/features/auth/auth-types";
import { authRoutes } from "@/features/auth/auth-routes";
import { setUser } from "@/features/auth/middleware";
import { TasksPage } from "@/features/tasks/pages/TasksPage";
import { taskRoutes } from "@/features/tasks/task-routes";

/**
 * Alt som ligger på `ctx` for én forespørsel.
 *
 * `user` er typet her, og da er `ctx.user` typet i hele appen, fordi
 * types/rw.d.ts mater denne typen inn i rwsdk. Selve typen eies av
 * auth-featuren.
 */
export type AppContext = {
  user: SessionUser | null;
};

/**
 * worker.tsx er nå bare et koblingsbrett. Auth-logikken ligger i
 * features/auth, oppgavene i features/tasks:
 *
 *   features/
 *     auth/    hvem er du (setUser), får du lov (requireUser/requireAdmin)
 *     tasks/   schema -> repository -> service -> controller -> routes
 *                                              \-> actions (server actions)
 *
 * Rekkefølgen i defineApp betyr noe: mellomvare kjører i den rekkefølgen den
 * står, og setUser må ligge før rutene som sjekker ctx.user.
 *
 * `./demo.sh` kjører hele API-turen i rekkefølge med curl.
 */
const app = defineApp([
  setCommonHeaders(),
  setUser,

  /* -----------------------------------------------------------------------
   * API-ruter. Ligger UTENFOR render(), så svaret er akkurat det handleren
   * returnerer: JSON, uten HTML-skall rundt.
   * -------------------------------------------------------------------- */
  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),

  ...authRoutes,
  ...taskRoutes,

  /**
   * Én bruker med oppgavene sine.  200 OK / 404 / 401
   *
   * Står fortsatt her fordi den hører til en `users`-feature vi ikke har
   * laget ennå. TANKE: Hvordan ville features/users sett ut?
   *
   * `db.query` leser relations.ts, og `with: { tasks: true }` gir
   * bruker.tasks som et ferdig nøstet array, uten at vi skriver join selv.
   *
   * curl -s localhost:5173/api/users/1/tasks
   * curl -s localhost:5173/api/users/me/tasks -H "x-demo-user: admin"
   */
  route("/api/users/:id/tasks", async ({ params, ctx }) => {
    if (params.id === "me" && !ctx.user) {
      return Response.json(
        { error: "Du må være innlogget for å bruke /me" },
        { status: 401 },
      );
    }

    const userId = params.id === "me" ? ctx.user!.id : Number(params.id);

    if (!Number.isInteger(userId)) {
      return Response.json(
        { error: `Ugyldig bruker-id: ${params.id}` },
        { status: 400 },
      );
    }

    const user = await db.query.users.findFirst({
      where: { id: userId },
      with: { tasks: true },
    });

    if (!user) {
      return Response.json(
        { error: `Fant ingen bruker med id ${userId}` },
        { status: 404 },
      );
    }

    return Response.json({ user });
  }),

  // Sider. render(Document, [...]) pakker dem i et helt HTML-dokument.
  //
  //   http://localhost:5173/        forsiden (med demo-bruker-panelet)
  //   http://localhost:5173/tasks   opprett, se og slett oppgaver
  render(Document, [route("/", Home), route("/tasks", TasksPage)]),
]);

export default { fetch: app.fetch };
