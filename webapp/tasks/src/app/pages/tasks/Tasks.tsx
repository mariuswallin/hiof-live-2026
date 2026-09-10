import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requestInfo } from "rwsdk/worker";
import { TaskItem } from "@/components/TaskItem";
import { DemoLogin } from "@/components/DemoLogin";

/**
 * En server-komponent (RSC).
 *
 * Den snakker med databasen DIREKTE. Ingen fetch, ingen /api/tasks, ingen
 * loading-state: spørringen kjører på serveren mens HTML-en lages, og
 * nettleseren får ferdig markup.
 *
 * `db` og `tasks` importeres her uten at noe av det havner i bundelen som
 * sendes til klienten. Det er hele poenget med RSC.
 *
 * Det interaktive ligger i `TaskItem`, som er en klient-komponent. Grensen
 * går akkurat der: server henter, klient klikker.
 */
export async function Tasks() {
  const allTasks = await db.select().from(tasks);
  const { ctx } = requestInfo;

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-bold">Oppgaver</h1>
      <p className="mt-2 text-slate-600">
        Lista er hentet på serveren. Avkryssingen går gjennom en server action.
      </p>

      <DemoLogin email={ctx.user?.email ?? null} />

      {allTasks.length === 0 ? (
        <p className="mt-6 text-slate-500" data-testid="empty-list">
          Ingen oppgaver ennå. Kjør <code>npm run seed</code>.
        </p>
      ) : (
        <ul className="mt-6 space-y-2" data-testid="task-list">
          {allTasks.map((task) => (
            <TaskItem
              key={task.id}
              id={task.id}
              title={task.title}
              completed={task.completed}
            />
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-slate-500">
        Kryss av, og last siden på nytt. Haken blir stående, fordi den ligger i
        databasen og ikke bare i React sin state.
      </p>
      <a className="text-sm underline" href="/">
        Til forsiden
      </a>
    </main>
  );
}
