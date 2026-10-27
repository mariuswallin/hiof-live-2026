import { requestInfo } from "rwsdk/worker";
import { isAdmin } from "../auth-types";

export function ProfilePage() {
  const { user } = requestInfo.ctx;

  if (!user) {
    // Skjer ikke da vi har requreUserPage
    return (
      <main className="mx-auto max-w-md p-8 font-sans">
        <h1 className="text-3xl font-bold">Profil</h1>

        <p className="mt-6 text-slate-600">
          Du må være innlogget for å se profilen din. Logg inn ved å gå til{" "}
          <a href="/login" className="text-blue-600 underline">
            /login
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8 font-sans">
      <h1 className="text-3xl font-bold">Profil</h1>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="font-medium">Navn</dt>
        <dd>{user.name}</dd>

        <dt className="font-medium">E-post</dt>
        <dd>{user.email}</dd>

        <dt className="font-medium">Rolle</dt>
        <dd>{user.role}</dd>
      </dl>

      <p className="mt-6 text-slate-600">
        {isAdmin(user)
          ? "Som admin ser du alle oppgavene."
          : "Du ser bare dine egne oppgaver."}
      </p>
    </main>
  );
}
