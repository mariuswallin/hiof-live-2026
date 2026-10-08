import { createContext, use, useState, type ReactNode } from "react";

import { TASKS } from "@/data/tasks";
import type { Task } from "@/utils/task-schema";

/**
 * Samme TasksContext som i demo-appen: TasksProvider i rot-_layout.tsx og
 * useTasks() der dataene trengs. Nytt her er bare remove().
 *
 * I demoen var Context "kjekt å ha" - alt lå på én skjerm, så props hadde
 * holdt. Med navigasjon er den NØDVENDIG: lista, detaljsiden og "ny oppgave"-
 * modalen er SØSKEN-skjermer som ruteren lager - vi rendrer dem aldri selv,
 * og kan derfor ikke gi dem props.
 */
type TaskContextData = {
  tasks: Task[];
  toggle: (id: string) => void;
  add: (task: Omit<Task, "id">) => void;
  remove: (id: string) => void;
};

const TasksContext = createContext<TaskContextData | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(TASKS);

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
