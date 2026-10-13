import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";
import { db } from "./db";
import { tasks } from "./db/schema";
import {
  createTaskRepository,
  taskRepository,
} from "./features/tasks/task-repository";
import { taskRoutes } from "./features/tasks/task-routes";

/**
 * Alt som ligger på `ctx` for én forespørsel.
 *
 * Tom nå. Legger dere til `session` her, blir `ctx.session` typet i hele appen,
 * fordi types/rw.d.ts mater denne typen inn i rwsdk. Samme navn som i slidene.
 */
export type AppContext = {};

const app = defineApp([
  // Middleware. Kjører for hver forespørsel, i rekkefølgen de står.
  setCommonHeaders(),

  // API-rute. Ligger UTENFOR render(), så svaret er akkurat det handleren
  // returnerer: JSON, uten HTML-skall rundt.
  ...taskRoutes,
  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),
  route("/api/tasks", async (params) => {
    const headers = Object.fromEntries(params.request.headers.entries());
    const allTasks = await taskRepository.list();
    return Response.json({
      ok: true,
      tasks: allTasks,
    });
  }),

  // Sider. render(Document, [...]) pakker dem i et helt HTML-dokument.
  render(Document, [route("/", Home)]),
]);

export default { fetch: app.fetch };
