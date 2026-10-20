// Her har vi en komponent som henter inn en rekke med Tasks
// Den bruker mest trolig TaskItem

import { db } from "@/db";

// Den har hensiktsmessige props
// De kan være at denne har logikken / koblingen til det som har med
// opprettelse av ny task / sletting av task å gjøre

export async function TaskListPage() {
  const data = await db.query.tasks.findMany();

  console.log(data);

  return (
    <main>
      <h1>Task List Page</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </main>
  );
}
