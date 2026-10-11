import { DEMO_USER_KEYS, DEMO_USERS } from "../demo-users";

/**
 * /login. En server-komponent med et helt vanlig HTML-skjema.
 *
 * Ingen "use client", ingen useState og ingen fetch. Nettleseren sender
 * skjemaet selv, som den har gjort siden 90-tallet:
 *
 *   <form method="post" action="/login">   ->   POST /login
 *                                               user=kari&admin=on
 *
 * Svaret er en redirect med Set-Cookie (auth-controller.ts). Fordi ingenting
 * her er JavaScript, virker innloggingen også før siden er hydrert.
 *
 * JUKS: det finnes ikke noe passord, og du velger rollen din selv. Poenget er
 * å se hva som skjer ETTER innloggingen: cookien, ctx.user og vaktene. De er
 * like i en ekte app.
 */
export function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-8 font-sans">
      <h1 className="text-3xl font-bold">Logg inn</h1>
      <p className="mt-2 text-slate-600">
        Jukseinnlogging. Velg hvem du er, uten passord.
      </p>

      <form method="post" action="/login" className="mt-6 flex flex-col gap-6">
        <fieldset>
          <legend className="text-sm font-medium">Bruker</legend>
          {DEMO_USER_KEYS.map((key, index) => (
            <label key={key} className="mt-2 flex items-center gap-2">
              {/* `name` er nøkkelen i skjemadataene, `value` er verdien. */}
              <input
                type="radio"
                name="user"
                value={key}
                defaultChecked={index === 0}
              />
              {DEMO_USERS[key].name}
              <span className="text-sm text-slate-500">
                {DEMO_USERS[key].email}
              </span>
            </label>
          ))}
        </fieldset>

        <label className="flex items-center gap-2">
          {/* Krysset av: admin=on. Ikke krysset av: feltet sendes ikke. */}
          <input type="checkbox" name="admin" />
          Logg inn som admin
        </label>

        <button
          type="submit"
          className="self-start rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Logg inn
        </button>
      </form>
    </main>
  );
}
