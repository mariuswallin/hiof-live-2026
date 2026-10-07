import type { TaskDTO } from "../task-mapper";

export function TaskItem({
  task,
  onDelete,
}: {
  task: TaskDTO;
  onDelete: (id: string) => void;
}) {
  const { id, completed, dueDate, title } = task;
  return (
    <li className="rounded-md border border-slate-200 p-3 data-[pending=true]:opacity-50">
      <div className="flex items-center gap-3">
        <label className="flex flex-1 items-center gap-3">
          <input type="checkbox" checked={completed} className="size-4" />
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
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Slett
        </button>
      </div>
    </li>
  );
}
