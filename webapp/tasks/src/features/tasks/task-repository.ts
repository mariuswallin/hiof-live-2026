import { eq } from "drizzle-orm";
import { db, type DB } from "@/db";
import { tasks, type CreateTask, type Task, type UpdateTask } from "@/db/schema";
import { Errors, executeDbOperation, type Result } from "@/lib/result";
import type { TaskListParams } from "./utils/validate-list-params";

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
  findMany(params: TaskListParams): Promise<Result<Task[]>>;
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
    /**
     * Skrevet ut UTEN executeDbOperation, så du ser hva den gjør: try/catch,
     * og et Result i begge greiner. De andre metodene under er like, bare
     * kortere fordi hjelperen skriver dette for dem.
     *
     * `db.query` er relasjons-API-et (samme som /api/users/:id/tasks bruker).
     * `where` er et vanlig objekt, og felt som er `undefined` hoppes over.
     * Uten `completed` og `q` blir det ingen WHERE, og alle radene kommer.
     *
     *   { completed: false, q: "oblig", limit: 5 }
     *   SELECT ... WHERE completed = 0 AND title LIKE '%oblig%'
     *   ORDER BY created_at DESC LIMIT 5
     */
    findMany: async ({ completed, q, limit }) => {
      try {
        const rows = await db.query.tasks.findMany({
          where: {
            completed,
            title: q ? { like: `%${q}%` } : undefined,
          },
          // Nyeste først. Uten orderBy er rekkefølgen udefinert i SQL.
          orderBy: { createdAt: "desc" },
          limit,
        });

        return { success: true, data: rows };
      } catch (error) {
        // Kaster databasen (låst fil, nettverk mot D1), blir det en feil i
        // retur i stedet for et krasj.
        console.error("Databasekall feilet:", error);
        return {
          success: false,
          error: {
            code: Errors.INTERNAL_SERVER_ERROR,
            message: "Noe gikk galt i databasen",
          },
        };
      }
    },

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
