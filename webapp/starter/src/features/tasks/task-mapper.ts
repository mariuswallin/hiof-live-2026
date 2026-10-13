// Her mapper vi data som kommer fra utsiden til et format som databasen kan forstå
// Her mapper vi data som kommer fra databasen og som skal videre gjennom
// systemet. Omitter også verdier som av ulike grunner ikke skal med videre

import type { Task } from "@/db/schema";

export type TaskDTO = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  createdAt: string;
};

export function toTaskDTO(task: Task): TaskDTO {
  const { id, title, completed, dueDate, createdAt } = task;
  return {
    id,
    title,
    completed,
    dueDate,
    createdAt: createdAt.toISOString(),
  };
}
