// Her setter vi opp REST-api routes for å ha alle routes knyttet til tasks
// på et sted. Har også aktuelle interruptors (mellomvare)

import { route } from "rwsdk/router";
import { controller } from "./task-controller";

export const taskRoutes = [
  route("/api/v1/tasks", {
    get: controller.list,
    post: [
      // requireUser,
      controller.create,
    ],
  }),
  route("/api/v1/tasks/:id", {
    get: controller.find,
    patch: [
      // requireUser,
      controller.update,
    ],
    delete: [
      // requireAdmin,
      controller.remove,
    ],
  }),
  route("/api/v1/tasks/:id/:action", {
    post: [
      // requireUser,
      controller.action,
    ],
  }),
];
