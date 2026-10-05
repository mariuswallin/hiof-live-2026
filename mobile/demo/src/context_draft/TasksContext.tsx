import { createContext, use, useState, type ReactNode } from "react";

import { TASKS } from "@/constants/tasks";
import type { Task } from "@/utils_draft/task-schema";

/**
 * Context = en måte å dele state på UTEN å sende den som props gjennom
 * hvert eneste nivå ("prop drilling").
 *
 * Tre deler:
 * 1. createContext  - lager "kanalen".
 * 2. TasksProvider  - eier state og legger den ut på kanalen. Alt INNI
 *                     <TasksProvider> kan lese den.
 * 3. useTasks()     - henter state fra kanalen i en komponent.
 *
 * NB: ikke i bruk ennå. Se kommentarene "CONTEXT:" i _layout.tsx, index.tsx
 * og TaskList.tsx for hvor den kan kobles inn. Samme mønster brukes i
 * mobile/navigation, der skjermene ikke kan få props fra hverandre.
 */
type TasksContextValue = {
  tasks: Task[];
  toggle: (id: string) => void;
  add: (title: string) => void;
};

// null som startverdi: da kan useTasks() oppdage at Provider mangler.
const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  // Samme state og samme oppdateringer som i index.tsx - bare flyttet hit.
  const [tasks, setTasks] = useState<Task[]>(TASKS);

  const toggle = (id: string) =>
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );

  const add = (title: string) =>
    setTasks((current) => [
      ...current,
      { id: String(Date.now()), title, done: false },
    ]);

  return (
    <TasksContext value={{ tasks, toggle, add }}>{children}</TasksContext>
  );
}

export function useTasks() {
  const context = use(TasksContext);

  if (!context) {
    throw new Error("useTasks må brukes inne i <TasksProvider>");
  }

  return context;
}
