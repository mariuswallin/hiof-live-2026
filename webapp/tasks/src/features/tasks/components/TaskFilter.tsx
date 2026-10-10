import type { Params } from "../utils/parse-params";

// ?completed=true&q=test
export function TaskFilter({ params }: { params: Params }) {
  return (
    <form
      method="get"
      className="mt-6 flex items-end gap-2 mb-12"
      data-testid="task-filter"
    >
      <label className="flex flex-1 flex-col text-sm font-medium">
        Søk
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Tittel inneholder…"
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
        />
      </label>

      <label className="flex flex-col text-sm font-medium">
        Status
        <select
          name="completed"
          defaultValue={params.completed ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
        >
          <option value="">Alle</option>
          <option value="false">Ikke ferdig</option>
          <option value="true">Ferdig</option>
        </select>
      </label>

      <button
        type="submit"
        className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-50"
      >
        Filtrer
      </button>
      <a className="px-2 py-2 text-sm underline" href="/tasks">
        Nullstill
      </a>
    </form>
  );
}
