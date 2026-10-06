import { desc, eq } from "drizzle-orm";
import { db, type DB } from "@/db";
import { tasks, type CreateTask, type Task, type UpdateTask } from "@/db/schema";
import { executeDbOperation, type Result } from "@/lib/result";

/**
 * REPOSITORY: det eneste laget som snakker med databasen.
 *
 * Interfacet er KONTRAKTEN. Servicen kjenner bare den, ikke Drizzle. Bytter vi
 * ut Drizzle med rå SQL eller Prisma, er det bare denne fila som endres.
 *
 * Alle metoder gir et Result, og ingen kaster (se executeDbOperation).
 * "Fant ikke" er IKKE en feil her: findById gir `null`, og det er servicen
 * som bestemmer at det betyr 404.
 */
export interface TaskRepository {
  findMany(): Promise<Result<Task[]>>;
  findById(id: string): Promise<Result<Task | null>>;
  create(data: CreateTask): Promise<Result<Task>>;
  update(id: string, data: UpdateTask): Promise<Result<Task | null>>;
  remove(id: string): Promise<Result<void>>;
}

/**
 * FACTORY + DEPENDENCY INJECTION.
 *
 * Funksjonen får databasen som argument i stedet for å bruke `db` direkte.
 * Det er hele trikset: i appen sender vi inn D1 (nederst i fila), i testen
 * sender vi inn SQLite i minnet (se __tests__/task-service.test.ts).
 *
 * TANKE: Hva måtte vi gjort for å teste dette hvis `db` var hardkodet inne i
 * hver metode?
 */
export function createTaskRepository(db: DB): TaskRepository {
  return {
    findMany: () =>
      executeDbOperation(() =>
        // Nyeste først. Uten orderBy er rekkefølgen udefinert i SQL.
        db.select().from(tasks).orderBy(desc(tasks.createdAt)),
      ),

    findById: (id) =>
      executeDbOperation(async () => {
        const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
        return task ?? null;
      }),

    create: (data) =>
      executeDbOperation(async () =>
        db.insert(tasks).values(data).returning().get(),
      ),

    update: (id, data) =>
      executeDbOperation(async () => {
        const task = await db
          .update(tasks)
          .set(data)
          .where(eq(tasks.id, id))
          .returning()
          .get();
        return task ?? null;
      }),

    remove: (id) =>
      executeDbOperation(async () => {
        await db.delete(tasks).where(eq(tasks.id, id));
      }),
  };
}

// Instansen appen bruker. D1 inn, repository ut.
export const taskRepository = createTaskRepository(db);
