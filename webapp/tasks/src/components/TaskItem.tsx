"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleTaskCompleted } from "@/app/pages/tasks/actions";

/**
 * En klient-komponent som kaller en server action.
 *
 * Importen over ser ut som en helt vanlig funksjonsimport, men
 * `toggleTaskCompleted` kjører på serveren. Det React sender over, er navnet
 * på funksjonen og argumentene. Selve koden, og `db`, blir aldri lastet ned
 * hit.
 *
 * `useTransition` gir oss `pending` gratis, så knappen kan vise at noe
 * skjer mens vi venter på serveren.
 *
 * Boksen er `disabled` helt til komponenten har hydrert. Server-HTML-en er
 * der lenge før JavaScript-en er lastet, og i det gapet gjør et klikk
 * ingenting. Da er det ærligere å vise det enn å late som knappen virker.
 * Det gir e2e-testen noe konkret å vente på også.
 */
export function TaskItem({
  id,
  title,
  completed: initialCompleted,
}: {
  id: string;
  title: string;
  completed: boolean;
}) {
  // Serveren eier sannheten, men vi holder en kopi her for at haken skal
  // flytte seg med én gang. Svaret fra serveren overstyrer den etterpå.
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  // useEffect kjører bare i nettleseren, aldri under server-rendringen.
  useEffect(() => setHydrated(true), []);

  const toggle = () => {
    setError(null);

    startTransition(async () => {
      const result = await toggleTaskCompleted(id, !completed);

      if (result.ok) {
        setCompleted(result.task.completed);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <li className="rounded-md border border-slate-200 p-3" data-testid="task">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={completed}
          disabled={!hydrated || pending}
          onChange={toggle}
          className="size-4"
        />
        <span
          className={completed ? "text-slate-400 line-through" : ""}
          data-testid="title"
        >
          {title}
        </span>
        <span className="ml-auto text-xs text-slate-400" data-testid="status">
          {pending ? "lagrer…" : completed ? "ferdig" : "ikke ferdig"}
        </span>
      </label>

      {error && (
        <p className="mt-2 text-sm text-red-600" data-testid="error">
          {error}
        </p>
      )}
    </li>
  );
}
