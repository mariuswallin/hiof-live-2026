"use client";

import { createTaskAction } from "../actions";
import type { TaskDTO } from "../task-mapper";
import { CreateTaskForm } from "./CreateTaskForm";
import { TaskItem } from "./TaskItem";

export function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  function onDelete(id: string) {
    console.log("Deleted", id);
  }

  return (
    <section>
      <CreateTaskForm action={createTaskAction} />
      <ul className="mt-6 space-y-2" data-testid="task-list">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  );
}
