"use client";

/**
 * Juksepålogging, kun for demoen.
 *
 * `setUser` i worker.tsx leser enten headeren `x-demo-user` (praktisk i curl)
 * eller cookien `demo-user` (praktisk i nettleseren). Her setter vi cookien og
 * laster siden på nytt, så server-komponenten rendres med en ny `ctx.user`.
 *
 * En ekte innlogging ville satt en signert cookie fra serveren. Poenget her er
 * bare å kunne bytte rolle midt i en demo.
 */
export function DemoLogin({ email }: { email: string | null }) {
  const setUser = (value: string) => {
    document.cookie = `demo-user=${value}; path=/; max-age=3600`;
    location.reload();
  };

  const logOut = () => {
    document.cookie = "demo-user=; path=/; max-age=0";
    location.reload();
  };

  return (
    <div className="mt-6 flex items-center gap-3 rounded-md bg-slate-100 p-3 text-sm">
      <span data-testid="logged-in-as">
        {email ? `Innlogget som ${email}` : "Ikke innlogget"}
      </span>

      {email ? (
        <button
          type="button"
          onClick={logOut}
          className="ml-auto rounded border border-slate-300 px-3 py-1"
        >
          Logg ut
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setUser("admin")}
          className="ml-auto rounded bg-slate-900 px-3 py-1 text-white"
        >
          Logg inn som admin
        </button>
      )}
    </div>
  );
}
