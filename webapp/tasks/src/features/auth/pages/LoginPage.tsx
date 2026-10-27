import { db } from "@/db";

export async function LoginPage() {
  // USIKKERT: viser alle brukerne til alle som besøker siden. Alternativ:
  // felt for e-post og passord, slik at ingen ser hvem som finnes.
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
        <form
          method="post"
          action="/login"
          className="mt-6 flex flex-col gap-6"
        >
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
