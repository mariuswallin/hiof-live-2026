// Her kobler jeg opp ulike routes som jeg skal kunne bruk
// eks login, logout, register
// og metodene som jeg skal kunne bruke til dette

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
            userId: "",
          },
        },
      },
      { status: 400 },
    );
  }
  // Her ville vi sjekket passord mot hash
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
      Location: "/task-list",
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

export const authRoutes = [
  route("/login", { get: LoginPage, post: login }),
  route("/logout", { get: logout }),
  route("/profile", [requireUserPage, ProfilePage]),
];
