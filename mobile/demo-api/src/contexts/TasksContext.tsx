// STEG 0: api/tasks.ts -> HER (addApi, isLoading, error) -> app/index.tsx
// STEG 1: api/tasks.ts -> HER (toggleApi, removeApi) -> app/index.tsx
// STEG 2: app/index.tsx er delt opp. Nå bruker FLERE skjermer useTasks():
//   (tabs)/tasks/index.tsx (lista), (tabs)/tasks/[id].tsx (toggle/slett),
//   new-task.tsx (addApi), (tabs)/_layout.tsx (badge), (tabs)/index.tsx (antall)

// Før: import { TASKS } from "@/data/tasks" - lista startet som en konstant.
// STEG 0: listTasks og createTask. STEG 1: updateTask og deleteTask.
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type ApiTask,
} from "@/api/tasks";
import type { Task } from "@/utils/task-schema";
// STEG 0: useEffect, for å hente lista når appen starter.
import { createContext, use, useEffect, useState } from "react";

type TaskContextData = {
  tasks: Task[];
  // STEG 0: mens lista hentes, og hvis det gikk galt. Skjermen bestemmer hva
  // som vises.
  isLoading: boolean;
  error: string;
  toggle: (id: string) => void;
  add: (task: Omit<Task, "id">) => void;
  // STEG 0: Promise - kalleren kan vente på serveren, og fange feilen hvis den
  // svarer nei.
  addApi: (task: Omit<Task, "id">) => Promise<void>;
  // STEG 1: samme idé for toggle og slett.
  toggleApi: (id: string) => Promise<void>;
  removeApi: (id: string) => Promise<void>;
};

const TasksContext = createContext<TaskContextData | null>(null);

/**
 * STEG 0: API-et og appen har ulike "språk" for samme ting:
 *
 *   API (ApiTask)                App (Task)
 *   { id: "k3x9...",             { id: "k3x9...",
 *     title: "Lese",               title: "Lese",
 *     completed: false }           done: false }
 *
 * Vi oversetter ÉN gang, rett etter hentingen. Resten av appen (TaskList,
 * TaskItem ...) kjenner bare Task og trenger ikke endres.
 */
function toTask(apiTask: ApiTask): Task {
  return { id: apiTask.id, title: apiTask.title, done: apiTask.completed };
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  // STEG 0: tom liste til svaret fra webappen kommer (før: useState(TASKS)).
  const [tasks, setTasks] = useState<Task[]>([]);
  // STEG 0: true fra start - vi har ikke fått svar ennå.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // STEG 0: hent lista ÉN gang, når provideren mountes ([] = ingen
  // avhengigheter). Funksjonen i useEffect kan ikke være async selv, derfor
  // lager vi load() inni og kaller den.
  useEffect(() => {
    async function load() {
      try {
        const apiTasks = await listTasks();
        setTasks(apiTasks.map(toTask));
      } catch (error) {
        // Webappen kjører ikke ("Network request failed"), eller svarte 500.
        setError(error instanceof Error ? error.message : "Ukjent feil");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  // NB: toggle og add (uendret fra før) endrer bare LOKAL state - webappen
  // vet ingenting. Etter en refresh hentes lista på nytt, og endringene er
  // borte. De står igjen for å kunne sammenligne med addApi/toggleApi/removeApi.

  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function add(task: Omit<Task, "id">) {
    const newTask = {
      id: (tasks.length + 1).toString(),
      ...task,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
  }

  /**
   * STEG 0: som add(), men oppgaven LAGRES i webappen (POST /api/v1/tasks).
   *
   *   add()     lager id-en selv, oppdaterer state med en gang
   *   addApi()  venter på serveren, og bruker oppgaven den sender TILBAKE -
   *             med id-en serveren laget. Overlever en refresh.
   *
   * Svarer serveren nei (eller ikke i det hele tatt), kaster createTask, og
   * setTasks kjøres aldri. Feilen går videre til kalleren (new-task.tsx).
   */
  async function addApi(task: Omit<Task, "id">) {
    // Oversett tilbake til API-ets språk: done -> completed.
    const created = await createTask({
      title: task.title,
      completed: task.done,
    });

    // Først i lista: webappen sorterer nyeste først (createdAt desc).
    setTasks((prev) => [toTask(created), ...prev]);
  }

  /**
   * STEG 1: som toggle(), men lagret i webappen (PATCH /api/v1/tasks/:id).
   *
   * VENTER på serveren, akkurat som addApi: state endres først når serveren
   * har sagt ja, og vi bruker oppgaven den sender tilbake. Enkelt og alltid
   * riktig - men avkrysningen kommer et lite øyeblikk etter trykket.
   */
  async function toggleApi(id: string) {
    // Vi trenger dagens verdi for å sende den MOTSATTE til serveren.
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // App-språk -> API-språk: !done blir completed.
    const updated = await updateTask(id, { completed: !task.done });

    // Bytt ut akkurat denne oppgaven med serverens versjon (ny array, nye objekter).
    setTasks((prev) => prev.map((t) => (t.id === id ? toTask(updated) : t)));
  }

  /**
   * STEG 1: sletter i webappen (DELETE /api/v1/tasks/:id) - OPTIMISTISK.
   *
   * DELETE tar 1 sekund i dev. I stedet for å vente, later vi som om det gikk
   * bra, og retter opp hvis ikke:
   *   1. fjern oppgaven fra lista MED EN GANG
   *   2. spør serveren
   *   3. sa den nei: legg lista tilbake slik den var, og kast feilen videre
   *
   * Sammenlign med toggleApi over, som venter. Optimistisk føles raskere,
   * men brukeren kan se noe som ikke er sant et øyeblikk.
   */
  async function removeApi(id: string) {
    // Lista slik den er NÅ - det er den vi ruller tilbake til.
    const previous = tasks;

    // 1. Fjern med en gang.
    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      // 2. Spør serveren.
      await deleteTask(id);
    } catch (error) {
      // 3. Serveren sa nei: rull tilbake, og la skjermen som kalte vise feilen.
      setTasks(previous);
      throw error;
    }
  }

  // STEG 0 og 1: de nye verdiene må også med i value, ellers ser ingen dem.
  return (
    <TasksContext
      value={{
        tasks,
        isLoading,
        error,
        toggle,
        add,
        addApi,
        toggleApi,
        removeApi,
      }}
    >
      {children}
    </TasksContext>
  );
}

export function useTasks() {
  const context = use(TasksContext);

  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }

  return context;
}

// export function useStudents({ students }: { students: any }) {
//   const [initialStudents, setStudents] = useState(students);

//   const addStudent = (student: any) => {
//     setStudents((prev) => [...prev, student]);
//   };

//   return { students: initialStudents, addStudent };
// }
