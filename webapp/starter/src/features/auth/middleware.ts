// verifisere at vi er logget inn
// verfisere at vi har en gitt rolle
// oppdatere ctx med nøvendig data

import type { RouteMiddleware } from "rwsdk/router";
import { isAdmin } from "./auth-types";
import { db } from "@/db";

export const requireUser: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 401,
          message: "Du må være innlogget. Logg inn ved å gå til /login",
          fieldErrors: {},
        },
      },
      { status: 401 },
    );
  }
};

export const requireAdmin: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 401,
          message: "Du må være innlogget. Logg inn ved å gå til /login",
          fieldErrors: {},
        },
      },
      { status: 401 },
    );
  }
  if (!isAdmin(ctx.user)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 403,
          message: "Du må være innlogget. Logg inn ved å gå til /login",
          fieldErrors: {},
        },
      },
      { status: 403 },
    );
  }
};

export const setUser: RouteMiddleware = async ({ ctx }) => {
  const userId = 1; // her skal vi parse cookie

  if (!userId) {
    ctx.user = null;
    return;
  }

  const user = await db.query.users.findFirst({
    where: { id: userId },
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  ctx.user = user ?? null;
};
