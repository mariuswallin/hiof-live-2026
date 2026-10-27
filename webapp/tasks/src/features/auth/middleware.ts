// verifisere at vi er logget inn
// verfisere at vi har en gitt rolle
// oppdatere ctx med nøvendig data

import type { RouteMiddleware } from "rwsdk/router";
import { isAdmin } from "./auth-types";
import { db } from "@/db";
import { readBearerUserId, readSessionUserId } from "./session";

export const requireUser: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "401",
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
          code: "401",
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
          code: "403",
          message: "Bare admin har lov til dette",
          fieldErrors: {},
        },
      },
      { status: 403 },
    );
  }
};

export const setUser: RouteMiddleware = async ({ ctx, request }) => {
  // Nettleseren sender cookien, mobilappen sender en header. Resten er likt.
  const userId = readSessionUserId(request) ?? readBearerUserId(request);

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

export const requireUserPage: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
};
