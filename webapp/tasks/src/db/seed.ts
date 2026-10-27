import { defineScript } from "rwsdk/worker";
import { drizzle } from "drizzle-orm/d1";
import { users, tasks } from "./schema";

export const seedData = async (env: Env) => {
  const db = drizzle(env.DB);

  await db.delete(tasks);
  await db.delete(users);

  // Brukerne /login viser i nedtrekkslista, med rollen sin. Faste id-er, så
  // de er de samme hver gang seeden kjøres.
  const [kari, ola] = await db
    .insert(users)
    .values([
      {
        id: 1,
        name: "Kari Nordmann",
        email: "kari@example.com",
        role: "admin",
      },
      { id: 2, name: "Ola Hansen", email: "ola@example.com", role: "user" },
    ])
    .returning();

  await db.insert(tasks).values([
    {
      title: "Lese leksjonen før timen",
      completed: true,
      userId: kari.id,
      dueDate: new Date(Date.now() - 86_400_000),
    },
    {
      title: "Sette opp prosjektet",
      completed: false,
      userId: kari.id,
      dueDate: new Date(Date.now() + 86_400_000),
    },
    {
      // Ola sin. Ola ser bare denne. Kari er admin, og ser alle tre.
      title: "Skrive obligen",
      completed: false,
      userId: ola.id,
    },
  ]);

  console.log("Seeding ferdig");
};

export default defineScript(async ({ env }) => {
  await seedData(env);
  return Response.json({ success: true });
});
