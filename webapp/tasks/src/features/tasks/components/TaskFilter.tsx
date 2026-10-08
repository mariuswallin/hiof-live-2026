import type { Params } from "../utils/parse-params";

/**
 * Filter for lista. Et vanlig HTML-skjema med `method="get"`: nettleseren gjør
 * feltene om til query-parametere selv, uten JavaScript.
 *
 *   Søk "oblig", Status "Ikke ferdig"   ->   /tasks?q=oblig&completed=false
 *
 * Server-komponent, ingen state. URL-en ER tilstanden: last siden på nytt,
 * eller del lenken, så får du samme filter.
 *
 * `params` er det TasksPage leste fra URL-en, så feltene viser det som er
 * valgt. Tomme felt sendes som `?q=&completed=`, og betyr "ikke satt" (se
 * validate-list-params.ts).
 *
 * TANKE: Velg "Ferdig" og lag en ny oppgave. Den dukker opp og forsvinner
 * igjen. Hvorfor? (Hint: useOptimistic i TaskList, og WHERE i findMany.)
 */
export function TaskFilter({ params }: { params: Params }) {
  return (
    <form
      method="get"
      className="mt-6 flex items-end gap-2"
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
