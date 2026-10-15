import { createContext, use, useState, type ReactNode } from "react";

import { cached } from "@/api/cache";
import { listTodos, type Todo } from "@/api/dummy-json";
import type { Task } from "@/utils/task-schema";

/**
 * Samme TasksContext som i demo-appen: TasksProvider i rot-_layout.tsx og
 * useTasks() der dataene trengs. Nytt her:
 *
 * - Oppgavene HENTES fra et eksternt API, i stedet for å starte med
 *   TASKS-konstanten. Med React 19 sin use() + <Suspense> - se under.
 * - remove(), så detaljsiden kan slette.
 *
 * I demoen var Context "kjekt å ha" - alt lå på én skjerm, så props hadde
 * holdt. Med navigasjon er den NØDVENDIG: lista, detaljsiden og "ny oppgave"-
 * skjemaet er SØSKEN-skjermer som ruteren lager - vi rendrer dem aldri selv,
 * og kan derfor ikke gi dem props.
 */
type TaskContextData = {
  // Ingen isLoading/error! Mens lista hentes, finnes ikke provideren ennå -
  // React viser Suspense-fallbacken i stedet (se _layout.tsx).
  tasks: Task[];
  toggle: (id: string) => void;
  add: (task: Omit<Task, "id">) => void;
  remove: (id: string) => void;
};

const TasksContext = createContext<TaskContextData | null>(null);

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

/** Nøkkelen i cachen (api/cache.ts). ErrorBoundary i _layout.tsx glemmer den. */
export const TASKS_KEY = "tasks";

/** Henter lista og oversetter den til appens format. */
async function loadTasks() {
  const todos = await listTodos();
  return todos.map(toTask);
}

export function TasksProvider({ children }: { children: ReactNode }) {
  /**
   * HENTING MED use() - React 19
   *
   * Før: useState([]) + isLoading + error + useEffect med AbortController,
   * og ALLE skjermer måtte sjekke isLoading før de viste noe.
   *
   * Nå: use(promise) "pakker ut" verdien til et promise.
   * - Venter det:  komponenten SUSPENDERER - React viser nærmeste
   *                <Suspense fallback> (her i _layout.tsx).
   * - Er det klart: use() gir oss lista, og koden fortsetter som vanlig.
   * - Feilet det:  feilen kastes til nærmeste ErrorBoundary (_layout.tsx).
   *
   * cached(): use() trenger SAMME promise ved hver render (se api/cache.ts).
   */
  const initialTasks = use(cached(TASKS_KEY, loadTasks));

  // Hit kommer vi bare når lista ER hentet. Den blir startverdien til vanlig
  // state, så toggle/add/remove virker akkurat som før.
  const [tasks, setTasks] = useState(initialTasks);

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
    <TasksContext value={{ tasks, toggle, add, remove }}>
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
