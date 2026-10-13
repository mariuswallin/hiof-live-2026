import { defineScript } from "rwsdk/worker";
import { drizzle } from "drizzle-orm/d1";
import { users, tasks } from "./schema";

export const seedData = async (env: Env) => {
  const db = drizzle(env.DB);

  await db.delete(tasks);
  await db.delete(users);

  const [user] = await db
    .insert(users)
    .values({ name: "Test Testesen", email: "test@example.com" })
    .returning();

  await db.insert(tasks).values([
    {
      title: "Lese leksjonen før timen",
      completed: true,
      userId: user.id,
      dueDate: new Date(Date.now() - 86_400_000),
    },
    {
      title: "Sette opp prosjektet",
      completed: false,
      userId: user.id,
      dueDate: new Date(Date.now() + 86_400_000),
    },
  ]);

  console.log("Seeding ferdig");
};

export default defineScript(async ({ env }) => {
  await seedData(env);
  return Response.json({ success: true });
});
