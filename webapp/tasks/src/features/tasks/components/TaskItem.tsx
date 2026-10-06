"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { TaskDTO } from "../task-mapper";
import { toggleTaskCompleted } from "../actions";

/**
 * En oppgave i lista. `pending` er satt på oppgaver som bare finnes
 * optimistisk (laget i nettleseren, ikke bekreftet av serveren ennå).
 */
export type TaskListItem = TaskDTO & { pending?: boolean };

/**
 * Én oppgave. Avkrysning går via server action, sletting via API (se
 * TaskList.tsx, som eier onDelete).
 *
 * useOptimistic(verdi) gir en kopi av verdien som kan endres MIDLERTIDIG
 * inne i en transition:
 *
 *   klikk                 -> haken flytter seg med én gang (optimistisk)
 *   serveren svarer ok    -> rwsdk rendrer siden på nytt, `task.completed`
 *                            har nå den nye verdien, og kopien er ikke lenger
 *                            nødvendig
 *   serveren svarer feil  -> transitionen er ferdig, og React går AUTOMATISK
 *                            tilbake til `task.completed`. Ingen manuell
 *                            "angre"-kode.
 *
 * Sammenlign med den gamle versjonen, som hadde useState + setCompleted i
 * både suksess- og feilgrenen.
 */
export function TaskItem({
  task,
  onDelete,
}: {
  task: TaskListItem;
  onDelete: (id: string) => void;
}) {
  const [completed, setOptimisticCompleted] = useOptimistic(task.completed);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    setError(null);

    startTransition(async () => {
      setOptimisticCompleted(!completed);

      const result = await toggleTaskCompleted(task.id, !completed);
      if (!result.success) setError(result.error);
    });
  };

  // Optimistiske oppgaver (task.pending) finnes ikke i databasen ennå, så
  // de kan verken krysses av eller slettes før serveren har svart.
  const disabled = isPending || task.pending;

  return (
    <li
      className="rounded-md border border-slate-200 p-3 data-[pending=true]:opacity-50"
      data-pending={task.pending ?? false}
      data-testid="task"
    >
      <div className="flex items-center gap-3">
        <label className="flex flex-1 items-center gap-3">
          <input
            type="checkbox"
            checked={completed}
            disabled={disabled}
            onChange={toggle}
            className="size-4"
          />
          <span
            className={completed ? "text-slate-400 line-through" : ""}
            data-testid="title"
          >
            {task.title}
          </span>
        </label>

        <span className="text-xs text-slate-400" data-testid="status">
          {isPending || task.pending
            ? "lagrer…"
            : completed
              ? "ferdig"
              : "ikke ferdig"}
        </span>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onDelete(task.id)}
          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Slett
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" data-testid="error">
          {error}
        </p>
      )}
    </li>
  );
}
