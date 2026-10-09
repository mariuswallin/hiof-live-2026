import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";
import { taskRoutes } from "./features/tasks/task-routes";
import { TasksPage } from "./features/tasks/pages/TasksPage";
import { TasksPageClient } from "./features/tasks/pages/TasksPageClient";

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
