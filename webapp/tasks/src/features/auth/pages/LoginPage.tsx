import { db } from "@/db";

/**
 * /login. En server-komponent med et helt vanlig HTML-skjema.
 *
 * Ingen "use client", ingen useState og ingen fetch. Nettleseren sender
 * skjemaet selv, som den har gjort siden 90-tallet:
 *
 *   <form method="post" action="/login">   ->   POST /login
 *                                               userId=2
 *
 * Svaret er en redirect med Set-Cookie (auth-routes.ts). Fordi ingenting her
 * er JavaScript, virker innloggingen også før siden er hydrert.
 *
 * JUKS: det finnes ikke noe passord, og lista viser alle brukerne i
 * databasen, med rollen i parentes. En ekte innloggingsside røper aldri hvem
 * som finnes. Poenget er å se hva som skjer ETTER innloggingen: cookien,
 * ctx.user og vaktene. De er like i en ekte app.
 */
export async function LoginPage() {
  // FORENKLET: spørringen står rett i siden. Brukerne kommer fra seeden.
  const users = await db.query.users.findMany({
    columns: { id: true, name: true, role: true },
    orderBy: { id: "asc" },
  });

  return (
    <main className="mx-auto max-w-md p-8 font-sans">
      <h1 className="text-3xl font-bold">Logg inn</h1>
      <p className="mt-2 text-slate-600">
        Jukseinnlogging. Velg hvem du er, uten passord.
      </p>

      {users.length === 0 ? (
        <p className="mt-6 text-red-600" role="alert">
          Ingen brukere i databasen. Kjør <code>npm run seed</code>.
        </p>
      ) : (
        <form method="post" action="/login" className="mt-6 flex flex-col gap-6">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Bruker
            {/* `name` er nøkkelen i skjemadataene, `value` er verdien. */}
            <select
              name="userId"
              className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.name} (${user.role})`}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="self-start rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Logg inn
          </button>
        </form>
      )}
    </main>
  );
}
