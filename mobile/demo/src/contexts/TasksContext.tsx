import { TASKS } from "@/data/tasks";
import type { Task } from "@/utils/task-schema";
import { createContext, use, useState } from "react";

type TaskContextData = {
  tasks: Task[];
  toggle: (id: string) => void;
  add: (task: Omit<Task, "id">) => void;
};

const TasksContext = createContext<TaskContextData | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(TASKS);

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

  return <TasksContext value={{ tasks, toggle, add }}>{children}</TasksContext>;
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
