// Her kobler jeg opp ulike routes som jeg skal kunne bruk
// eks login, logout, register
// og metodene som jeg skal kunne bruke til dette
//
// FORENKLET: ingen controller, service eller repository her. En ekte auth har
// samme lagdeling som tasks.

import type { RequestInfo } from "rwsdk/worker";
import { clearSessionCookie, createSessionCookie } from "./session";
import { LoginPage } from "./pages/LoginPage";
import { route } from "rwsdk/router";
import { requireUserPage } from "./middleware";
import { ProfilePage } from "./pages/ProfilePage";
import { db } from "@/db";

async function login({ request }: RequestInfo) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    // Bodyen var ikke et skjema, for eksempel JSON.
    return Response.json(
      {
        ok: false,
        error: {
          code: "400",
          message: "Forventet skjemadata",
          fieldErrors: {},
        },
      },
      { status: 400 },
    );
  }

  const formObject = Object.fromEntries(form);

  const validFormData =
    typeof formObject === "object" &&
    "userId" in formObject &&
    Number.isInteger(Number(formObject.userId)) &&
    Number(formObject.userId) > 0;

  if (!validFormData) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "400",
          message: "Ugyldig innlogging",
          fieldErrors: {
            userId: ["Mangler bruker"],
          },
        },
      },
      { status: 400 },
    );
  }

  // USIKKERT: ingen passord, du er den du sier du er. Alternativ: e-post og
  // passord, og sjekk passordet mot en hash som er lagret på brukeren.
  const user = await db.query.users.findFirst({
    where: { id: Number(formObject.userId) },
  });

  if (!user) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "400",
          message: "Ugyldig innlogging",
          fieldErrors: { userId: ["Brukeren finnes ikke"] },
        },
      },
      { status: 400 },
    );
  }

  // 303 betyr "det gikk bra, hent DENNE siden med GET". Uten redirect ville
  // Reload i skjermen etter innlogging sendt skjemaet en gang til.
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/tasks",
      "Set-Cookie": createSessionCookie(user.id),
    },
  });
}

function logout() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}

// POST /api/v1/login med JSON, f.eks. { "userId": 2 }
//
// Samme innlogging som over, men for mobilappen. Den får tokenet i svaret, og
// sender det selv i `Authorization: Bearer <token>` på hver forespørsel.
async function apiLogin({ request }: RequestInfo) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: "400",
          message: "Body må være JSON",
          fieldErrors: {},
        },
      },
      { status: 400 },
    );
  }

  const userId =
    typeof body === "object" && body !== null && "userId" in body
      ? Number(body.userId)
      : NaN;

  if (!Number.isInteger(userId) || userId < 1) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "400",
          message: "Ugyldig innlogging",
          fieldErrors: { userId: ["Mangler bruker"] },
        },
      },
      { status: 400 },
    );
  }

  // USIKKERT: ingen passord her heller. Alternativ: samme som i login over.
  const user = await db.query.users.findFirst({
    where: { id: userId },
    columns: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "400",
          message: "Ugyldig innlogging",
          fieldErrors: { userId: ["Brukeren finnes ikke"] },
        },
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      ok: true,
      data: {
        // USIKKERT: tokenet er bare id-en, se readBearerUserId i session.ts.
        token: String(user.id),
        user,
      },
    },
    { status: 200 },
  );
}

// Sider. Ligger inne i render() i worker.tsx.
export const authRoutes = [
  route("/login", { get: LoginPage, post: login }),
  route("/logout", { post: logout }),
  route("/profile", [requireUserPage, ProfilePage]),
];

// API. Ligger utenfor render(), så svaret er bare JSON.
export const authApiRoutes = [route("/api/v1/login", { post: apiLogin })];
