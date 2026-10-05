import { route } from "rwsdk/router";

/**
 * Rutene auth-featuren eier. Spres inn i defineApp i worker.tsx:
 *
 *   defineApp([setUser, ...authRoutes, ...taskRoutes, render(...)])
 */
export const authRoutes = [
  /**
   * Hvem tror serveren at jeg er?  200 OK
   *
   * Nyttig først i demoen: kjør den tre ganger og se ctx.user endre seg.
   *
   * curl -s localhost:5173/api/me
   * curl -s localhost:5173/api/me -H "x-demo-user: bruker"
   * curl -s localhost:5173/api/me -H "x-demo-user: admin"
   */
  route("/api/me", ({ ctx }) => Response.json({ user: ctx.user })),
];
