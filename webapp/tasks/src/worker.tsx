import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";
import { taskRoutes } from "./features/task-routes";
import { TasksPage } from "./features/pages/TasksPage";
import { TasksPageClient } from "./features/pages/TasksPageClient";

export type AppContext = {};

const app = defineApp([
  setCommonHeaders(),
  ...taskRoutes,
  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),

  render(Document, [
    route("/", Home),
    route("/tasks", TasksPage),
    route("/tasks-client", TasksPageClient),
  ]),
]);

export default { fetch: app.fetch };
