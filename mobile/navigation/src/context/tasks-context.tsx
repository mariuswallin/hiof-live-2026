import { createContext, use, useState, type ReactNode } from "react";

import { TASKS } from "@/constants/tasks";
import type { Task } from "@/utils/task-schema";

/**
 * Hvorfor Context her?
 *
 * I demo-appen bodde `tasks` i useState i index.tsx, og ble sendt ned som
 * props. Med navigasjon går ikke det: lista, detaljsiden og "ny oppgave"-
 * modalen er SØSKEN-skjermer som ruteren lager - vi rendrer dem aldri selv,
 * og kan derfor ikke gi dem props.
 *
 * Løsning: løft state OVER navigatoren (i rot-_layout.tsx) og la hver skjerm
 * hente det den trenger med useTasks().
 */
type TasksContextValue = {
  tasks: Task[];
  toggle: (id: string) => void;
  add: (title: string) => void;
  remove: (id: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(TASKS);

  // Samme regler som i demoen: alltid ny array + nye objekter.
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

  const remove = (id: string) =>
    setTasks((current) => current.filter((task) => task.id !== id));

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
