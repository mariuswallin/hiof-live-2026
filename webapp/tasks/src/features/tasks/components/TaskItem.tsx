"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/features/auth/components/AuthProvider";
import type { TaskDTO } from "../task-mapper";
import { toggleTaskCompleted } from "../actions";

/**
 * Én oppgave. Avkrysning går via server action, sletting via API (se
 * TaskList.tsx, som eier onDelete).
 *
 * Haken viser alltid `task.completed`, altså det serveren sist sendte:
 *
 *   klikk                 -> "lagrer…", knappene er låst
 *   serveren svarer ok    -> rwsdk rendrer siden på nytt, og `task.completed`
 *                            har den nye verdien
 *   serveren svarer feil  -> `task.completed` er uendret, og vi viser feilen
 *
 * useTransition gir `isPending`, som er true helt til serveren har svart OG
 * siden er rendret på nytt.
 *
 * Slett-knappen vises bare for admin. `useAuth()` henter brukeren fra context,
 * så verken TasksPage eller TaskList trenger å sende den ned hit som prop.
 *
 * TANKE: Bytt `isAdmin &&` med `true &&` og trykk "Slett" som vanlig bruker.
 * Serveren svarer 403, og oppgaven blir stående. Knappen var aldri vakten.
 *
 * TANKE: Avkryssingsboksen er IKKE skjult for uinnloggede. Prøv den: servicen
 * svarer "Du må være innlogget". Burde UI-et stoppet deg først?
 */
export function TaskItem({
  task,
  onDelete,
}: {
  task: TaskDTO;
  onDelete: (id: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { isAdmin } = useAuth();

  const toggle = () => {
    setError(null);

    startTransition(async () => {
      const result = await toggleTaskCompleted(task.id, !task.completed);
      if (!result.success) setError(result.error);
    });
  };

  const remove = () => {
    startTransition(() => onDelete(task.id));
  };

  return (
    <li className="rounded-md border border-slate-200 p-3" data-testid="task">
      <div className="flex items-center gap-3">
        <label className="flex flex-1 items-center gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            disabled={isPending}
            onChange={toggle}
            className="size-4"
          />
          <span
            className={task.completed ? "text-slate-400 line-through" : ""}
            data-testid="title"
          >
            {task.title}
          </span>
          {task.dueDate && (
            // ISO fra DTO-en: "2026-10-07T00:00:00.000Z". Datodelen holder,
            // og blir lik på server og klient (ingen tidssone, ingen locale).
            <span className="text-xs text-slate-500" data-testid="due-date">
              frist {task.dueDate.slice(0, 10)}
            </span>
          )}
        </label>

        <span className="text-xs text-slate-400" data-testid="status">
          {isPending ? "lagrer…" : task.completed ? "ferdig" : "ikke ferdig"}
        </span>

        {isAdmin && (
          <button
            type="button"
            disabled={isPending}
            onClick={remove}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Slett
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" data-testid="error">
          {error}
        </p>
      )}
    </li>
  );
}
