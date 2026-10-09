import type { Task } from "@/db/schema";

export type TaskDTO = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  createdAt: string;
};

export function toTaskDTO(task: Task): TaskDTO {
  let { id, title, completed, dueDate, createdAt } = task;

  return {
    id,
    title,
    completed,
    dueDate,
    createdAt: createdAt.toISOString(),
  };
}
