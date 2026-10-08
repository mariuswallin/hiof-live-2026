import { createContext, use, useEffect, useState, type ReactNode } from "react";

import { TodosResponseSchema, type Todo } from "@/api/dummy-json";
import type { Task } from "@/utils/task-schema";

/**
 * Samme TasksContext som i demo-appen: TasksProvider i rot-_layout.tsx og
 * useTasks() der dataene trengs. Nytt her:
 *
 * - Oppgavene HENTES fra et eksternt API med useEffect, i stedet for å
 *   starte med TASKS-konstanten. Derfor også isLoading og error.
 * - remove(), så detaljsiden kan slette.
 *
 * I demoen var Context "kjekt å ha" - alt lå på én skjerm, så props hadde
 * holdt. Med navigasjon er den NØDVENDIG: lista, detaljsiden og "ny oppgave"-
 * skjemaet er SØSKEN-skjermer som ruteren lager - vi rendrer dem aldri selv,
 * og kan derfor ikke gi dem props.
 */
type TaskContextData = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  toggle: (id: string) => void;
  add: (task: Omit<Task, "id">) => void;
  remove: (id: string) => void;
};

const TasksContext = createContext<TaskContextData | null>(null);

/**
 * Et gratis placeholder-API med falske todos. Åpne URL-en i nettleseren for
 * å se hva vi får tilbake. ?limit=8 = bare de 8 første (id 1-8).
 */
const TODOS_URL = "https://dummyjson.com/todos?limit=8";

/**
 * API-et og appen har ulike "språk" for samme ting:
 *
 *   API (Todo)                   App (Task)
 *   { id: 3,                     { id: "3",
 *     todo: "Do something",        title: "Do something",
 *     completed: false,            done: false }
 *     userId: 68 }
 *
 * Vi oversetter ÉN gang, rett etter hentingen. Resten av appen (TaskItem,
 * TaskList, detaljsiden ...) kjenner bare Task og trenger ikke endres.
 * id blir streng fordi id-en havner i URL-en (/tasks/3), og URL-parametere
 * er alltid strenger.
 */
function toTask(todo: Todo): Task {
  return { id: String(todo.id), title: todo.todo, done: todo.completed };
}

export function TasksProvider({ children }: { children: ReactNode }) {
  // Før (demoen): useState(TASKS) - dataene fantes med en gang.
  // Nå: lista er TOM til API-et har svart. Derfor tre tilstander:
  const [tasks, setTasks] = useState<Task[]>([]); // dataene
  const [isLoading, setIsLoading] = useState(true); // venter vi på svar?
  const [error, setError] = useState<string | null>(null); // gikk noe galt?

  /**
   * HENTING MED useEffect
   *
   * Hvorfor ikke bare kalle fetch rett i komponenten? Fordi komponenten
   * kjøres på nytt ved HVER render. fetch der = ny forespørsel hver gang
   * state endres (og setTasks gir en ny render ... evig løkke).
   *
   * useEffect kjører koden ETTER at skjermen er tegnet. Tomt dependency-
   * array [] = bare én gang, når provideren mountes. Provideren ligger over
   * navigatoren og mountes én gang per oppstart/refresh - akkurat som
   * AuthProvider. Bytt tab og kom tilbake: ingen ny henting.
   */
  useEffect(() => {
    // AbortController: lar oss avbryte forespørselen hvis provideren
    // forsvinner før svaret kommer (se oppryddingen nederst).
    const controller = new AbortController();

    // useEffect kan ikke være async selv, så vi lager en async-funksjon
    // inni og kaller den.
    async function loadTasks() {
      try {
        // 1. Send forespørselen. signal kobler den til controlleren.
        const response = await fetch(TODOS_URL, { signal: controller.signal });

        // 2. fetch kaster IKKE ved 404/500 - bare ved nettverksfeil.
        //    Derfor må vi sjekke statuskoden selv.
        if (!response.ok) {
          throw new Error(`Kunne ikke hente oppgaver (${response.status})`);
        }

        // 3. Les body som JSON. Vi VET ikke hva som kom - det er `unknown`.
        const json: unknown = await response.json();

        // 4. Valider med zod. Feil form -> parse() kaster -> havner i catch.
        //    Etterpå vet TypeScript at `todos` er Todo[].
        const { todos } = TodosResponseSchema.parse(json);

        // 5. Oversett til appens format og legg i state. Alle skjermer som
        //    bruker useTasks() rendres på nytt med lista.
        setTasks(todos.map(toTask));
      } catch (e) {
        // Avbrudd er ikke en feil - det var vi som ba om det.
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Ukjent feil");
      } finally {
        // Ferdig - uansett om det gikk bra eller ikke.
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadTasks();

    // Opprydding: kjøres når provideren unmountes. I utvikling kjører React
    // effekten to ganger (Strict Mode) - da avbrytes den første hentingen.
    return () => controller.abort();
  }, []);

  // NB: toggle/add/remove endrer bare LOKAL state - API-et vet ingenting.
  // Etter en refresh hentes originallista på nytt, og endringene er borte.
  // (Skal de lagres, må vi sende POST/PATCH/DELETE til API-et også.)

  // Samme regler som i demoen: alltid ny array + nye objekter.
  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function add(task: Omit<Task, "id">) {
    // Date.now() i stedet for tasks.length + 1: når vi kan slette, kan
    // lengden gå ned igjen, og da får to oppgaver samme id.
    const newTask = { id: String(Date.now()), ...task };

    setTasks((prev) => [...prev, newTask]);
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  return (
    <TasksContext value={{ tasks, isLoading, error, toggle, add, remove }}>
      {children}
    </TasksContext>
  );
}

/** Hook for skjermene. Kaster hvis noen glemmer TasksProvider. */
export function useTasks() {
  const context = use(TasksContext);

  if (!context) {
    throw new Error("useTasks må brukes inne i <TasksProvider>");
  }

  return context;
}
