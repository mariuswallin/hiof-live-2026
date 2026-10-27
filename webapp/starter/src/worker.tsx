import { defineApp } from "rwsdk/worker";
import { layout, render, route } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";

import { taskRepository } from "./features/tasks/task-repository";
import { taskRoutes } from "./features/tasks/task-routes";
import { TasksCreatePage } from "./features/tasks/pages/TaskCreatePage";
import { TaskListPage } from "./features/tasks/pages/TaskListPage";
import type { SessionUser } from "./features/auth/auth-types";
import { requireUserPage, setUser } from "./features/auth/middleware";
import { authRoutes } from "./features/auth/auth-routes";
import { AppLayout } from "./components/Layout";

/**
 * Alt som ligger på `ctx` for én forespørsel.
 *
 * Tom nå. Legger dere til `session` her, blir `ctx.session` typet i hele appen,
 * fordi types/rw.d.ts mater denne typen inn i rwsdk. Samme navn som i slidene.
 */
export type AppContext = {
  user: SessionUser | null;
};

const app = defineApp([
  // Middleware. Kjører for hver forespørsel, i rekkefølgen de står.
  setCommonHeaders(),
  setUser,

  // API-rute. Ligger UTENFOR render(), så svaret er akkurat det handleren
  // returnerer: JSON, uten HTML-skall rundt.
  ...taskRoutes,
  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),
  route("/api/tasks", async (params) => {
    const allTasks = await taskRepository.list();
    return Response.json({
      ok: true,
      tasks: allTasks,
    });
  }),

  // Sider. render(Document, [...]) pakker dem i et helt HTML-dokument.
  render(Document, [
    layout(AppLayout, [
      route("/", Home),
      route("/tasks", TasksCreatePage),
      route("/task-list", [requireUserPage, TaskListPage]),
      ...authRoutes,
    ]),
  ]),
]);

export default { fetch: app.fetch };
