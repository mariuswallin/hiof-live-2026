// STEG 2A: contexts/AuthContext.tsx (token) -> HER -> api/tasks.ts
// STEG 2B: FLERE skjermer bruker useTasks() nå: (tabs)/tasks/index.tsx (lista),
//   (tabs)/tasks/[id].tsx (toggle/slett), new-task.tsx (addApi),
//   (tabs)/_layout.tsx (badge) og (tabs)/index.tsx (antall)

import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type ApiTask,
} from "@/api/tasks";
import type { Task } from "@/utils/task-schema";
// STEG 2A: TasksProvider leser tokenet. Derfor ligger den INNI AuthProvider
// i app/_layout.tsx.
import { useAuth } from "./AuthContext";
import { createContext, use, useEffect, useState } from "react";

type TaskContextData = {
  tasks: Task[];
  isLoading: boolean;
  error: string;
  toggle: (id: string) => void;
  add: (task: Omit<Task, "id">) => void;
  addApi: (task: Omit<Task, "id">) => Promise<void>;
  toggleApi: (id: string) => Promise<void>;
  removeApi: (id: string) => Promise<void>;
};

const TasksContext = createContext<TaskContextData | null>(null);

function toTask(apiTask: ApiTask): Task {
  return { id: apiTask.id, title: apiTask.title, done: apiTask.completed };
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Henter på nytt hver gang tokenet endrer seg: ved innlogging, og når en
  // annen bruker logger inn. Uten token er ingen innlogget, og lista tømmes.
  //
  // STEG 2A: før [] (hent én gang ved oppstart). Da var ingen logget inn ennå,
  // og webappen ville svart 401. Nå er tokenet en avhengighet.
  useEffect(() => {
    if (!token) {
      setTasks([]);
      return;
    }

    async function load(token: string) {
      setIsLoading(true);
      setError("");
      try {
        const apiTasks = await listTasks(token);
        setTasks(apiTasks.map(toTask));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Ukjent feil");
      } finally {
        setIsLoading(false);
      }
    }

    load(token);
  }, [token]);

  // STEG 2A: alle *Api-funksjonene trenger tokenet. Mangler det, kaster vi
  // med en gang i stedet for å sende et kall vi vet gir 401.
  function requireToken() {
    if (!token) throw new Error("Du må være innlogget");
    return token;
  }

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

  async function addApi(task: Omit<Task, "id">) {
    const created = await createTask(requireToken(), {
      title: task.title,
      completed: task.done,
    });

    setTasks((prev) => [toTask(created), ...prev]);
  }

  async function toggleApi(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updated = await updateTask(requireToken(), id, {
      completed: !task.done,
    });

    setTasks((prev) => prev.map((t) => (t.id === id ? toTask(updated) : t)));
  }

  async function removeApi(id: string) {
    const previous = tasks;

    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      // STEG 2A: Ola får 403 her. Da rulles lista tilbake, og skjermen som
      // kalte viser "Bare admin har lov til dette".
      await deleteTask(requireToken(), id);
    } catch (error) {
      setTasks(previous);
      throw error;
    }
  }

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
