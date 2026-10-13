import { useState, useTransition } from "react";
import type { TaskDTO } from "../task-mapper";
import { toggleTaskCompleted } from "../actions";

export function TaskItem({
  task,
  onDelete,
}: {
  task: TaskDTO;
  onDelete: (id: string) => void;
}) {
  const { id, completed, dueDate, title } = task;

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    setError(null);

    startTransition(async () => {
      const result = await toggleTaskCompleted(id, !completed);
      if (!result.ok) setError(result.error);
    });
  };

  const remove = () => {
    startTransition(() => onDelete(id));
  };

  return (
    <li className="rounded-md border border-slate-200 p-3 data-[pending=true]:opacity-50">
      <div className="flex items-center gap-3">
        <label className="flex flex-1 items-center gap-3">
          <input
            type="checkbox"
            checked={completed}
            disabled={isPending}
            onChange={toggle}
            className="size-4"
          />
          <span
            className={completed ? "text-slate-400 line-through" : ""}
            data-testid="title"
          >
            {title}
          </span>
          {dueDate ? (
            <span className="text-xs text-slate-500" data-testid="due-date">
              frist {dueDate.toISOString().slice(0, 10)}
            </span>
          ) : null}
        </label>
        <span className="text-xs text-slate-400" data-testid="status">
          {isPending ? "lagrer…" : task.completed ? "ferdig" : "ikke ferdig"}
        </span>
        <button
          type="button"
          onClick={remove}
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
