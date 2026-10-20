import { db } from "@/db";

export async function LoginPage() {
  const users = await db.query.users.findMany({
    columns: { id: true, name: true, role: true },
    orderBy: { id: "asc" },
  });

  return (
    <main>
      <h1>Logg inn</h1>
      <p>Dette er en jukse logg inn. Velg hvem du er, uten passord.</p>
      {users.length === 0 ? (
        <p>Ingen brukere i databasen. Prøv å seed med brukere.</p>
      ) : null}
      <form method="post" action="/login">
        <select name="userId">
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
        <button type="submit">Logg inn</button>
      </form>
    </main>
  );
}
