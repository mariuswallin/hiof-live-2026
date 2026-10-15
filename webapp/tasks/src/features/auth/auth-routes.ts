import { route } from "rwsdk/router";
import type { RequestInfo } from "rwsdk/worker";
import z from "zod";
import { db } from "@/db";
import { LoginPage } from "./pages/LoginPage";
import { clearSessionCookie, createSessionCookie } from "./session";

/**
 * Rutene for å logge inn og ut.
 *
 * FORENKLET: handlerne står rett i denne fila. Tasks-featuren er delt i
 * routes -> controller -> service -> repository, og slik ville auth også sett
 * ut i en ekte app: en controller som leser skjemaet, en service som sjekker
 * passordet, og et repository som henter brukeren.
 *
 * Det viktige er HVEM som setter cookien. Det er serveren, i svaret:
 *
 *   POST /login   (userId=2)
 *     <- 303 See Other
 *        Location: /tasks
 *        Set-Cookie: session=2; HttpOnly; SameSite=Lax; …
 *
 * Åpne Network-fanen i DevTools og se på akkurat det svaret. Nettleseren
 * lagrer cookien, følger Location, og sender cookien med på GET /tasks.
 *
 * Logg inn med curl. `-c` lagrer cookien i en fil, `-b` sender den med:
 *
 *   curl -i -c admin.txt -d "userId=1" localhost:5173/login
 *   curl -i -c bruker.txt -d "userId=2" localhost:5173/login
 *   curl -s localhost:5173/api/v1/tasks -b bruker.txt
 */

/**
 * Det innloggingsskjemaet får lov til å sende. Nedtrekkslista har bare
 * brukere som finnes, men curl kan sende `userId=abc`. Derfor valideres det.
 *
 * Skjemadata er alltid tekst. `coerce` gjør "2" om til tallet 2.
 */
const loginSchema = z.object({
  userId: z.coerce.number("Velg en bruker").int().positive(),
});

/**
 * POST /login  303 / 400
 *
 * Et helt vanlig HTML-skjema, ingen JavaScript. Nettleseren sender feltene
 * som `application/x-www-form-urlencoded`, og `formData()` leser dem.
 */
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

  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "400",
          message: "Ugyldig innlogging",
          fieldErrors: z.flattenError(parsed.error).fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  // JUKS: vi sjekker bare at brukeren finnes. I en ekte app er det HER
  // passordet sammenlignes med hashen i databasen.
  const user = await db.query.users.findFirst({
    where: { id: parsed.data.userId },
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
  // F5 etter innlogging sendt skjemaet en gang til.
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/tasks",
      // Bare id-en. Rollen ligger i databasen, ikke i cookien.
      "Set-Cookie": createSessionCookie(user.id),
    },
  });
}

/**
 * POST /logout  303
 *
 * POST, ikke GET. En GET skal aldri endre noe. Var utlogging en lenke, kunne
 * en annen nettside logget deg ut med `<img src=".../logout">`.
 */
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
  // Samme adresse, to metoder: GET viser skjemaet, POST tar imot det.
  route("/login", { get: LoginPage, post: login }),
  route("/logout", { post: logout }),
];
