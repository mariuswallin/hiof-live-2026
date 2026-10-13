"use client";

import { navigate } from "rwsdk/client";
import { createTaskAction } from "../actions";
import { removeTask } from "../task-api";
import type { TaskDTO } from "../task-mapper";
import { CreateTaskForm } from "./CreateTaskForm";
import { TaskItem } from "./TaskItem";

export function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  // Midlertidig state for å håndtere om sletting går feil

  async function onDelete(id: string) {
    const result = await removeTask(id);
    if (!result.ok) {
      // Oppdatere lokal state med errormeldingen
      return;
    }

    await navigate(window.location.pathname, {
      history: "replace",
      info: { scrollToTop: false },
    });
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
