import { defineApp } from "rwsdk/worker";
import { layout, render, route } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { cors } from "@/app/cors";
import { Home } from "@/app/pages/Home";
import { AppLayout } from "@/components/Layout";
import { taskRoutes } from "./features/tasks/task-routes";
import { TasksPage } from "./features/tasks/pages/TasksPage";
import { TasksPageClient } from "./features/tasks/pages/TasksPageClient";
import type { SessionUser } from "./features/auth/auth-types";
import { requireUserPage, setUser } from "./features/auth/middleware";
import { authApiRoutes, authRoutes } from "./features/auth/auth-routes";

export type AppContext = {
  user: SessionUser | null;
};

const app = defineApp([
  // Middleware. Kjører for hver forespørsel, i rekkefølgen de står.
  setCommonHeaders(),
  cors(),
  setUser,

  // API-ruter. Utenfor render(), så svaret er bare JSON.
  ...authApiRoutes,
  ...taskRoutes,
  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),

  render(Document, [
    layout(AppLayout, [
      route("/", Home),
      route("/tasks", [requireUserPage, TasksPage]),
      route("/tasks-client", [requireUserPage, TasksPageClient]),
      ...authRoutes,
    ]),
  ]),
]);

export default { fetch: app.fetch };
