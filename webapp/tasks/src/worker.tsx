import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import type { RouteMiddleware } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";
import { Tasks } from "@/app/pages/tasks/Tasks";
import { tasks } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * Alt som ligger på `ctx` for én forespørsel.
 *
 * `user` er typet her, og da er `ctx.user` typet i hele appen, fordi
 * types/rw.d.ts mater denne typen inn i rwsdk.
 *
 * Merk at `id` er et TALL. Den skal matche users.id i databasen, som er
 * `int().primaryKey({ autoIncrement: true })`. Bruker vi en streng her, ryker
 * fremmednøkkelen i det vi lagrer en oppgave.
 */
export type AppContext = {
  user: {
    id: number;
    email: string;
    name: string;
  } | null;
};

/* =========================================================================
 * MELLOMVARE
 *
 * En mellomvare er en funksjon som kjører FØR handleren. Den får hele
 * `requestInfo` (ikke bare ctx), og har to valg:
 *
 *   returner ingenting  -> forespørselen går videre til neste ledd
 *   returner en Response -> kjeden stopper her, og dette blir svaret
 *
 * Det siste er hele poenget: en vakt slipper deg enten forbi, eller svarer
 * selv. Returnerer du noe annet enn en Response, for eksempel `true` eller
 * `false`, skjer det INGENTING, og alle slipper inn.
 * ====================================================================== */

/**
 * Finner ut hvem som spør, og legger brukeren på ctx.
 *
 * I en ekte app hentes brukeren fra en signert cookie eller en JWT, og
 * verifiseres. Her leser vi to kilder vi har funnet på selv, slik at dere kan
 * bytte rolle midt i demoen uten å bygge innlogging:
 *
 *   headeren `x-demo-user`   praktisk i curl
 *   cookien  `demo-user`     praktisk i nettleseren (se DemoLogin.tsx)
 *
 *   ingenting        -> ikke innlogget
 *   "admin"          -> admin
 *   hva som helst    -> vanlig bruker
 *
 * Begge brukerne peker på id 1, altså den seeden lager. Det er bare e-posten
 * som skiller dem, for det er den `requireAdmin` ser på.
 */
const readCookie = (request: Request, name: string) =>
  request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];

const setUser: RouteMiddleware = ({ ctx, request }) => {
  const demoUser =
    request.headers.get("x-demo-user") ?? readCookie(request, "demo-user");

  if (!demoUser) {
    ctx.user = null;
    return;
  }

  ctx.user =
    demoUser === "admin"
      ? { id: 1, email: "admin@test.no", name: "Admin User" }
      : { id: 1, email: "test@example.com", name: "Test Testesen" };
};

/**
 * Krever at noen er innlogget.  401 Unauthorized
 *
 * 401 betyr "jeg vet ikke hvem du er". Det er ikke det samme som 403.
 */
const requireUser: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return Response.json(
      { error: "Du må være innlogget. Prøv: -H 'x-demo-user: admin'" },
      { status: 401 },
    );
  }
};

/**
 * Krever at den innloggede er admin.  403 Forbidden
 *
 * 403 betyr "jeg VET hvem du er, og du får likevel ikke lov". Derfor må den
 * returnere en Response, ikke en boolean: en boolean stopper ingenting.
 */
const requireAdmin: RouteMiddleware = ({ ctx }) => {
  if (!ctx.user) {
    return Response.json({ error: "Du må være innlogget" }, { status: 401 });
  }

  if (!ctx.user.email.startsWith("admin@")) {
    return Response.json(
      { error: `${ctx.user.email} er ikke admin` },
      { status: 403 },
    );
  }
};

/* =========================================================================
 * VALIDERING
 *
 * Aldri send `await request.json()` rett inn i databasen. Da bestemmer den
 * som sender forespørselen hvilke kolonner som skrives, og kan finne på å
 * sette `id` eller `createdAt` selv. Zod plukker ut FELTENE VI TILLATER, og
 * kaster resten.
 *
 * `userId` står med vilje IKKE her. Hvem som eier oppgaven, tar vi fra
 * ctx.user. Lar vi klienten sende den, kan hvem som helst lage oppgaver i
 * andres navn.
 * ====================================================================== */
const createTaskSchema = z.object({
  title: z.string().min(1, "title kan ikke være tom"),
  completed: z.boolean().optional(),
  dueDate: z.coerce.date().optional(), // "2026-10-01" blir til en Date
});

// PUT gjenbruker samme regler, men alt er valgfritt: send bare det du endrer.
const updateTaskSchema = createTaskSchema.partial();

/* =========================================================================
 * Små hjelpere, så hver handler under blir kort nok til å leses i ett blikk.
 * ====================================================================== */
const notFound = (id: string) =>
  Response.json({ error: `Fant ingen oppgave med id ${id}` }, { status: 404 });

/** Leser og validerer body. Returnerer enten data eller et ferdig 400-svar. */
async function readBody<T extends z.ZodType>(request: Request, schema: T) {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    // 400 Bad Request: klienten sendte noe som ikke er gyldig JSON.
    return { error: Response.json({ error: "Ugyldig JSON" }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    // 400 igjen: JSON-en var gyldig, men feltene stemmer ikke med skjemaet.
    return {
      error: Response.json(
        { error: "Ugyldige felter", details: z.treeifyError(result.error) },
        { status: 400 },
      ),
    };
  }

  return { data: result.data as z.output<T> };
}

const findTask = (id: string) =>
  db.select().from(tasks).where(eq(tasks.id, id)).get();

const app = defineApp([
  // Mellomvare på toppnivå. Kjører for HVER forespørsel, i rekkefølgen de
  // står. setUser må ligge før rutene, ellers er ctx.user tom når vaktene
  // under skal sjekke den.
  setCommonHeaders(),
  setUser,

  /* -----------------------------------------------------------------------
   * API-ruter. Ligger UTENFOR render(), så svaret er akkurat det handleren
   * returnerer: JSON, uten HTML-skall rundt.
   *
   * Alle curl-eksemplene under står på ÉN linje, uten backslash, slik at de
   * kan markeres og limes rett inn i en terminal. Sett $ID først, så virker
   * de som de står:
   *
   * ID=$(curl -s localhost:5173/api/tasks | head -c 200 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
   *
   * `./demo.sh` kjører hele turen i rekkefølge og skriver ut hver kommando
   * før den kjøres. Praktisk å ha på storskjerm.
   *
   * Åpne i nettleseren (disse er åpne, uten vakt):
   *   http://localhost:5173/api/status
   *   http://localhost:5173/api/tasks
   *   http://localhost:5173/tasks
   *
   * Lesing er åpen, skriving krever innlogging, sletting krever admin.
   * Det er en helt vanlig fordeling, og den gir tre statuskoder å vise fram:
   * 200, 401 og 403.
   * -------------------------------------------------------------------- */
  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),

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

  /**
   * Én bruker med oppgavene sine.  200 OK / 404 / 401
   *
   * Her er relations verdt bryet. `db.select()` gir én tabell om gangen, og
   * skal dere ha med oppgavene, må dere skrive en join selv og sy sammen
   * radene etterpå. `db.query` leser relations.ts og gjør begge deler:
   *
   *   with: { tasks: true }   ->  bruker.tasks er et array, ferdig nøstet
   *
   * `where: { id }` er objekt-syntaksen fra Drizzle v1. Den gamle
   * `eq(users.id, id)`-formen gjelder fortsatt for db.select().
   *
   * `me` som id betyr "den innloggede". Da må vi vite hvem det er, og først
   * DA slår requireUser inn. Derfor ligger vakten inne i handleren og ikke
   * foran den: /api/users/1/tasks skal fortsatt være åpen.
   *
   * curl -s localhost:5173/api/users/1/tasks
   * curl -s localhost:5173/api/users/me/tasks -H "x-demo-user: admin"
   * curl -i localhost:5173/api/users/me/tasks
   * curl -i localhost:5173/api/users/999/tasks
   */
  route("/api/users/:id/tasks", async ({ params, ctx }) => {
    if (params.id === "me" && !ctx.user) {
      return Response.json(
        { error: "Du må være innlogget for å bruke /me" },
        { status: 401 }
      );
    }

    const userId = params.id === "me" ? ctx.user!.id : Number(params.id);

    if (!Number.isInteger(userId)) {
      return Response.json(
        { error: `Ugyldig bruker-id: ${params.id}` },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: { id: userId },
      with: { tasks: true },
    });

    if (!user) {
      return Response.json(
        { error: `Fant ingen bruker med id ${userId}` },
        { status: 404 }
      );
    }

    return Response.json({ user });
  }),

  route("/api/tasks", {
    /**
     * Hent alle oppgaver.  200 OK
     *
     * curl -s localhost:5173/api/tasks
     */
    get: async () => {
      const allTasks = await db.select().from(tasks);
      return Response.json({ tasks: allTasks });
    },

    /**
     * Opprett en oppgave.  201 Created / 401 / 400
     *
     * Legg merke til `[requireUser, handler]`: vakten står FØRST i lista, og
     * handleren sist. Slipper ikke vakten deg forbi, kjører handleren aldri.
     *
     * 201 skal fortelle hvor den nye ressursen ligger. Det er derfor vi
     * setter `Location` og sender raden tilbake: klienten trenger `id`-en,
     * og den er det serveren som lager.
     *
     * curl -i -X POST localhost:5173/api/tasks -H "content-type: application/json" -H "x-demo-user: admin" -d '{"title":"Skrive obligen"}'
     *
     * Prøv å bryte den. Uten header, altså 401:
     * curl -i -X POST localhost:5173/api/tasks -H "content-type: application/json" -d '{"title":"Skrive obligen"}'
     *
     * Tom title, altså 400 med forklaring i body:
     * curl -i -X POST localhost:5173/api/tasks -H "content-type: application/json" -H "x-demo-user: admin" -d '{"title":""}'
     */
    post: [
      requireUser,
      async ({ request, ctx }) => {
        const body = await readBody(request, createTaskSchema);
        if (body.error) return body.error;

        const task = await db
          .insert(tasks)
          // Eieren kommer fra ctx.user, ikke fra body.
          .values({ ...body.data, userId: ctx.user!.id })
          .returning()
          .get();

        return Response.json(
          { task },
          { status: 201, headers: { Location: `/api/tasks/${task.id}` } },
        );
      },
    ],
  }),

  route("/api/tasks/:id", {
    /**
     * Hent én oppgave.  200 OK / 404 Not Found
     *
     * curl -s localhost:5173/api/tasks/DIN_ID
     *   curl -i http://localhost:5173/api/tasks/finnesikke
     */
    get: async ({ params }) => {
      const task = await findTask(params.id);
      return task ? Response.json({ task }) : notFound(params.id);
    },

    /**
     * Endre en oppgave.  200 OK / 401 / 404 / 400
     *
     * Merk 404-sjekken FØR update: uten den svarer en update som traff null
     * rader like blidt 200, og klienten tror den endret noe som ikke finnes.
     *
     * curl -i -X PUT localhost:5173/api/tasks/$ID -H "content-type: application/json" -H "x-demo-user: admin" -d '{"title":"Nytt navn","completed":true}'
     */
    put: [
      requireUser,
      async ({ request, params }) => {
        const body = await readBody(request, updateTaskSchema);
        if (body.error) return body.error;

        if (!(await findTask(params.id))) return notFound(params.id);

        const task = await db
          .update(tasks)
          .set(body.data)
          .where(eq(tasks.id, params.id))
          .returning()
          .get();

        return Response.json({ task });
      },
    ],

    /**
     * Slett en oppgave.  204 No Content / 401 / 403 / 404
     *
     * To vakter etter hverandre. Rekkefølgen er ikke tilfeldig: først "hvem
     * er du" (401), så "får du lov" (403).
     *
     * 204 betyr "ok, og jeg har ingenting å sende tilbake". Statusen KAN
     * ikke ha body: gir du den en, kaster runtime en feil.
     *
     * curl -i -X DELETE localhost:5173/api/tasks/$ID
     * curl -i -X DELETE localhost:5173/api/tasks/$ID -H "x-demo-user: bruker"
     * curl -i -X DELETE localhost:5173/api/tasks/$ID -H "x-demo-user: admin"
     */
    delete: [
      requireUser,
      requireAdmin,
      async ({ params }) => {
        if (!(await findTask(params.id))) return notFound(params.id);

        await db.delete(tasks).where(eq(tasks.id, params.id));
        return new Response(null, { status: 204 });
      },
    ],
  }),

  /**
   * En "action"-rute: et verb i URL-en i stedet for en ressurs.
   *
   * Strengt tatt kunne PUT over gjort jobben. Den finnes her fordi mønsteret
   * er vanlig, og fordi den viser hvorfor slike ruter må være POST: en GET
   * skal aldri endre data. Nettlesere og lenkeforhåndslastere fyrer av
   * GET-forespørsler på egen hånd. En GET hit gir nå 405.
   *
   * curl -i -X POST localhost:5173/api/tasks/$ID/complete -H "x-demo-user: admin"
   * curl -i -X POST localhost:5173/api/tasks/$ID/uncomplete -H "x-demo-user: admin"
   * curl -i -X POST localhost:5173/api/tasks/$ID/tulle -H "x-demo-user: admin"
   * curl -i localhost:5173/api/tasks/$ID/complete
   */
  route("/api/tasks/:id/:action", {
    post: [
      requireUser,
      async ({ params }) => {
        // Ugyldig handling avvises før vi spør databasen. Ingen grunn til å
        // slå opp en rad vi uansett ikke skal gjøre noe med.
        let completed: boolean;

        switch (params.action) {
          case "complete":
            completed = true;
            break;
          case "uncomplete":
            completed = false;
            break;
          default:
            return Response.json(
              { error: `Ukjent handling: ${params.action}` },
              { status: 400 },
            );
        }

        if (!(await findTask(params.id))) return notFound(params.id);

        const task = await db
          .update(tasks)
          .set({ completed })
          .where(eq(tasks.id, params.id))
          .returning()
          .get();

        return Response.json({ task });
      },
    ],
  }),

  // Sider. render(Document, [...]) pakker dem i et helt HTML-dokument.
  //
  //   http://localhost:5173/        forsiden
  //   http://localhost:5173/tasks   server-komponent + server action
  render(Document, [route("/", Home), route("/tasks", Tasks)]),
]);

export default { fetch: app.fetch };
