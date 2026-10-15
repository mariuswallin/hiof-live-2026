import type { Task } from "@/db/schema";

export type TaskDTO = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  createdAt: string;
  // Første del av e-posten til eieren: "kari" for kari@example.com.
  owner: string;
};

export function toTaskDTO(task: Task, owner: { email: string }): TaskDTO {
  let { id, title, completed, dueDate, createdAt } = task;

  return {
    id,
    title,
    completed,
    dueDate,
    createdAt: createdAt.toISOString(),
    owner: owner.email.split("@")[0],
  };
}
