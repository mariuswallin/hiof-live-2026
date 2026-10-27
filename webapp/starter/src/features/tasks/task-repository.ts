import { db, type DB } from "@/db";
import { tasks, type CreateTask, type Task } from "@/db/schema";

export interface TaskRepository {
  create: (task: CreateTask) => Promise<
    | {
        ok: true;
        data: Task;
      }
    | {
        ok: false;
        error: {
          code: number;
          message: string;
          fieldErrors?: Record<string, string[]>;
        };
      }
  >;
  update: (id: string, task: any) => Promise<any>;
  get: (id: string) => Promise<any>;
  list: (params?: { userId?: number }) => Promise<any>;
  remove: (id: string) => Promise<any>;
}

export function createTaskRepository(_db: DB): TaskRepository {
  return {
    async create(data) {
      try {
        const createTask = await _db
          .insert(tasks)
          .values(data)
          .returning()
          .get();

        return {
          ok: true,
          data: createTask,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          error: {
            code: 500,
            message: "Noe gikk galt med koden",
            fieldErrors: {},
          },
        };
      }
    },
    async list({ userId }) {
      try {
        const rows = await _db.query.tasks.findMany({
          where: {
            userId,
          },
          orderBy: { createdAt: "desc" },
          with: { user: true },
        });

        return {
          ok: true,
          data: rows,
        };
      } catch (error) {
        console.error(error);

        return {
          ok: false,
          error: {
            code: "500",
            message: "Noe gikk galt med uthentingen",
            fieldErrors: {},
          },
        };
      }
    },
    get: async (id) => {
      // her bruker prisma
    },
    update: async (id, task) => {},
    remove: async (id) => {},
  };
}

//
export const taskRepository = createTaskRepository(db);

// repository.create({ title: "My Task", description: "This is my task" });
