// Her har vi en komponent som henter inn en rekke med Tasks
// Den bruker mest trolig TaskItem

import { db } from "@/db";
import { taskService } from "../task-service";

// Den har hensiktsmessige props
// De kan være at denne har logikken / koblingen til det som har med
// opprettelse av ny task / sletting av task å gjøre

export async function TaskListPage() {
  const data = await taskService.list();

  // const response = await fetch("/api/tasks")
  // const payload = await response.json()

  console.log(data);

  return (
    <main>
      <h1>Task List page</h1>
      {/* <Filter data={data} /> */}
      <ul>
        {data.map((item) => (
          <li>{item.title}</li>
        ))}
      </ul>
    </main>
  );
}

// // FilterComponent.ts

// ("use client");

// export function FilterComponent({ data }) {
//   // noe state her
//   // noe annet her
//   // en funksjon for å filtrere her
//   // retur av JSX her
// }
