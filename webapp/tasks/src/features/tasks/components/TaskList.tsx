"use client";

import { useOptimistic, useState, useTransition } from "react";
import { navigate } from "rwsdk/client";
import { createTaskAction } from "../actions";
import type { TaskDTO } from "../task-mapper";
import { deleteTask } from "../task-api";
import { CreateTaskForm } from "./CreateTaskForm";
import { TaskItem, type TaskListItem } from "./TaskItem";

type OptimisticAction =
  | { type: "add"; task: TaskListItem }
  | { type: "remove"; id: string };

/**
 * Reduceren for useOptimistic. Må være REN: samme inn gir samme ut. React kan
 * kjøre den flere ganger. Derfor lages den midlertidige id-en UTENFOR
 * (i onOptimisticCreate), ikke her inne.
 */
function reducer(current: TaskListItem[], action: OptimisticAction) {
  switch (action.type) {
    case "add":
      return [action.task, ...current];
    case "remove":
      return current.filter((task) => task.id !== action.id);
  }
}

/**
 * Lista, skjemaet og slettingen. Klient-komponent, fordi den har state.
 *
 * `tasks` kommer fra serveren (TasksPage) og er SANNHETEN. useOptimistic
 * legger et midlertidig lag oppå, som bare lever så lenge en transition
 * pågår. Når transitionen er ferdig, viser React `tasks` igjen, altså det
 * serveren sist sendte.
 *
 * To måter å snakke med serveren på, side om side:
 *
 *   OPPRETT  server action (createTaskAction) via <form action>
 *            rwsdk rendrer siden på nytt etterpå, så `tasks` er fersk
 *
 *   SLETT    fetch DELETE /api/tasks/:id (task-api.ts), "gammel" måte
 *            fetch vet ingenting om React, så vi må selv be om ferske data:
 *            navigate() til samme side henter server-komponentene på nytt
 *
 * TANKE: Slett-knappen vises for alle, også for vanlige brukere. Prøv som
 * "bruker": oppgaven forsvinner, serveren svarer 403, og den kommer tilbake
 * av seg selv. Det er useOptimistic som ruller tilbake. Burde knappen vært
 * skjult for ikke-admin? (Ja, for brukeren. Men sikkerheten ligger uansett i
 * requireAdmin på serveren, ikke i at knappen er borte.)
 */
export function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  const [optimisticTasks, updateOptimistic] = useOptimistic<
    TaskListItem[],
    OptimisticAction
  >(tasks, reducer);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Kalles fra skjemaet, INNE i transitionen useActionState starter.
  const handleOptimisticCreate = (title: string) => {
    updateOptimistic({
      type: "add",
      task: {
        id: `optimistic-${Date.now()}`,
        title,
        completed: false,
        dueDate: null,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    });
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);

    // useOptimistic krever en transition. Her lager vi den selv, fordi
    // dette ikke går via et skjema.
    startTransition(async () => {
      updateOptimistic({ type: "remove", id });

      const result = await deleteTask(id);

      if (!result.success) {
        // Ingen manuell tilbakerulling: når transitionen er ferdig, er
        // oppgaven tilbake fordi `tasks` fortsatt har den.
        setDeleteError(`${result.error.code}: ${result.error.message}`);
        return;
      }

      // Hent fersk liste fra serveren. Uten denne er oppgaven slettet i
      // databasen, men `tasks` er gammel, og den dukker opp igjen.
      // TANKE: Fjern linja og se hva som skjer.
      await navigate(window.location.pathname, {
        history: "replace",
        info: { scrollToTop: false },
      });
    });
  };

  return (
    <section>
      <CreateTaskForm
        action={createTaskAction}
        onOptimisticCreate={handleOptimisticCreate}
      />

      {deleteError && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          data-testid="delete-error"
        >
          Kunne ikke slette. {deleteError}
        </p>
      )}

      {optimisticTasks.length === 0 ? (
        <p className="mt-6 text-slate-500" data-testid="empty-list">
          Ingen oppgaver ennå. Lag en over, eller kjør <code>npm run seed</code>.
        </p>
      ) : (
        <ul className="mt-6 space-y-2" data-testid="task-list">
          {optimisticTasks.map((task) => (
            <TaskItem key={task.id} task={task} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
