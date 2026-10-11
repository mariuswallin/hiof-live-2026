import { requestInfo } from "rwsdk/worker";

/**
 * /profile. En side som krever innlogging.
 *
 * Kravet står IKKE her, men på ruta (auth-routes.ts):
 *
 *   route("/profile", [requireUserPage, ProfilePage])
 *
 * Prøv uten å være innlogget: du havner på /login, og denne funksjonen kjører
 * aldri.
 *
 * Siden viser det serveren vet om deg, altså `ctx.user`. Det er setUser som
 * la den der, etter å ha lest cookien.
 */
export function ProfilePage() {
  const { user } = requestInfo.ctx;

  // Vakten har allerede stoppet uinnloggede. Sjekken står her likevel: da vet
  // TypeScript at `user` finnes, og siden lekker ingenting hvis noen en dag
  // fjerner vakten fra ruta.
  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-8 font-sans">
        <p role="alert">Du må være innlogget for å se denne siden.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-bold">Min side</h1>
      <p className="mt-2 text-slate-600">
        Dette er <code>ctx.user</code>, slik serveren leste den ut av cookien.
      </p>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="text-slate-500">Navn</dt>
        <dd data-testid="profile-name">{user.name}</dd>
        <dt className="text-slate-500">E-post</dt>
        <dd>{user.email}</dd>
        <dt className="text-slate-500">Rolle</dt>
        <dd data-testid="profile-role">{user.role}</dd>
        <dt className="text-slate-500">Id</dt>
        <dd>{user.id}</dd>
      </dl>
    </main>
  );
}
