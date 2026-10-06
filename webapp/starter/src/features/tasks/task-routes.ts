// Her samler vi alle routes knytte til task
// Hvilken metode de bruker, interruptors, url m.m
// Slik at worker.ts kan bli slankere

import { route } from "rwsdk/router";

export const taskRoutes = [
  route("/api/tasks", {
    get: () => {},
    post: () => {},
  }),
  route("/api/tasks/:id", {
    get: () => {},
    put: () => {},
  }),
  route("/api/tasks/:id/:action", {
    post: () => {},
  }),
];
