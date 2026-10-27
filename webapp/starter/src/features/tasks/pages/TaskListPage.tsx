// Her har vi en komponent som henter inn en rekke med Tasks
// Den bruker mest trolig TaskItem

// import { db } from "@/db";
import { taskService } from "../task-service";
import { requestInfo } from "rwsdk/worker";
import { TaskItem } from "../components/TaskItem";
import { tasks } from "@/db/schema/task-schema";

// Den har hensiktsmessige props
// De kan være at denne har logikken / koblingen til det som har med
// opprettelse av ny task / sletting av task å gjøre

export async function TaskListPage() {
  const { ctx } = requestInfo;
  const result = await taskService.list(ctx.user);

  // const response = await fetch("/api/tasks")
  // const payload = await response.json()

  if (!result.ok) {
    return (
      <main>
        <h1>Task List page</h1>
        <p>Feil: {result.error.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1>Task List page</h1>
      {/* <Filter data={data} /> */}
      {result.data.length === 0 ? (
        <p>Ingen tasks funnet</p>
      ) : (
        <ul className="mt-6 space-y-2" data-testid="task-list">
          {result.data.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}
    </main>
  );
}

// // FilterComponent.tsx

// "use client";

// export function FilterComponent({ data }) {
//   // noe state her
//   // noe annet her
//   // en funksjon for å filtrere her
//   // retur av JSX her
// }
