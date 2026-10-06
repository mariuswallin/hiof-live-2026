// Her samler vi alle routes knytte til task
// Hvilken metode de bruker, interruptors, url m.m
// Slik at worker.ts kan bli slankere

import { route } from "rwsdk/router";

export const taskRoutes = [
  route("/api/tasks", {
    get: () => {
      // taskController.list
    },
    post: [
      // requireUser,
      () => {
        // taskController.create
      },
    ],
  }),
  route("/api/tasks/:id", {
    get: () => {
      // taskController.get
    },
    put: [
      // requireUser,
      () => {
        // taskController.update
      },
    ],
    delete: [
      // requireAdmin,
      () => {
        // taskController.remove
      },
    ],
  }),
  route("/api/tasks/:id/:action", {
    post: [
      // requireUser,
      () => {
        // taskController.action
      },
    ],
  }),
];
