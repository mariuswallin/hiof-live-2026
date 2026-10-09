"use client";

import { useState } from "react";
import { navigate } from "rwsdk/client";
import { createTaskAction } from "../actions";
import type { TaskDTO } from "../task-mapper";
import { deleteTask } from "../task-api";
import { CreateTaskForm } from "./CreateTaskForm";
import { TaskItem } from "./TaskItem";

/**
 * Lista, skjemaet og slettingen. Klient-komponent, fordi den har state.
 *
 * `tasks` kommer fra serveren (TasksPage) og er SANNHETEN. Lista viser alltid
 * det serveren sist sendte, ingenting annet.
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
 * "bruker": serveren svarer 403, og oppgaven blir stående. Burde knappen vært
 * skjult for ikke-admin? (Ja, for brukeren. Men sikkerheten ligger uansett i
 * requireAdmin på serveren, ikke i at knappen er borte.)
 */
export function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleteError(null);

    const result = await deleteTask(id);

    if (!result.success) {
      setDeleteError(`${result.error.code}: ${result.error.message}`);
      return;
    }

    // Hent fersk liste fra serveren. Uten denne er oppgaven slettet i
    // databasen, men `tasks` er gammel, og den blir stående i lista.
    // TANKE: Fjern linja og se hva som skjer.
    await navigate(window.location.pathname, {
      history: "replace",
      info: { scrollToTop: false },
    });
  };

  return (
    <section>
      <CreateTaskForm action={createTaskAction} />

      {deleteError && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          data-testid="delete-error"
        >
          Kunne ikke slette. {deleteError}
        </p>
      )}

      {tasks.length === 0 ? (
        <p className="mt-6 text-slate-500" data-testid="empty-list">
          Ingen oppgaver ennå. Lag en over, eller kjør <code>npm run seed</code>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-2" data-testid="task-list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
