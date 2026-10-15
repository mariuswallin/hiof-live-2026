import { defineApp } from "rwsdk/worker";
import { layout, render, route } from "rwsdk/router";
import { AppLayout } from "@/app/AppLayout";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";
import { authRoutes } from "./features/auth/auth-routes";
import type { SessionUser } from "./features/auth/auth-types";
import { requireUserPage, setUser } from "./features/auth/middleware";
import { taskRoutes } from "./features/tasks/task-routes";
import { TasksPage } from "./features/tasks/pages/TasksPage";
import { TasksPageClient } from "./features/tasks/pages/TasksPageClient";

// Alt som ligger på `ctx` for én forespørsel. types/rw.d.ts mater typen inn
// i rwsdk, så `ctx.user` er typet i hele appen.
export type AppContext = {
  user: SessionUser | null;
};

const app = defineApp([
  setCommonHeaders(),
  // Må stå FØR rutene: vaktene (requireUser, requireAdmin) leser ctx.user.
  setUser,
  ...taskRoutes,
  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),

  // layout(AppLayout, [...]) legger menyen og <AuthProvider> rundt hver side.
  render(Document, [
    layout(AppLayout, [
      route("/", Home),
      // Vakten står FØRST. Uten innlogging rendres siden aldri: du sendes
      // til /login.
      route("/tasks", [requireUserPage, TasksPage]),
      route("/tasks-client", [requireUserPage, TasksPageClient]),
      ...authRoutes,
    ]),
  ]),
]);

export default { fetch: app.fetch };
