// Her lager vi en abstraksjon rundt databasefunc. Slik at vi kan enklere
// teste å bytte ut databasedriveren om vi trenger det.

import { type DB, db } from "@/db";
import {
  tasks,
  type CreateTask,
  type Task,
  type UpdateTask,
} from "@/db/schema";
import type { TaksListParams } from "./utils/validate-list-params";
import { eq } from "drizzle-orm";

export interface TaskRepository {
  create(data: CreateTask): Promise<
    | {
        ok: true;
        data: Task;
      }
    | {
        ok: false;
        error: {
          code: string;
          message: string;
          fieldErrors: Record<string, string[]>;
        };
      }
  >;
  findById(id: string): Promise<
    | {
        ok: true;
        // null = ingen oppgave med denne id-en
        data: Task | null;
      }
    | {
        ok: false;
        error: {
          code: string;
          message: string;
          fieldErrors: Record<string, string[]>;
        };
      }
  >;
  findMany(params: TaksListParams): Promise<
    | {
        ok: true;
        data: Task[];
      }
    | {
        ok: false;
        error: {
          code: string;
          message: string;
          fieldErrors: Record<string, string[]>;
        };
      }
  >;
  remove(id: string): Promise<
    | {
        ok: true;
      }
    | {
        ok: false;
        error: {
          code: string;
          message: string;
          fieldErrors: Record<string, string[]>;
        };
      }
  >;
  update(
    id: string,
    data: UpdateTask,
  ): Promise<
    | {
        ok: true;
        // null = ingen oppgave med denne id-en
        data: Task | null;
      }
    | {
        ok: false;
        error: {
          code: string;
          message: string;
          fieldErrors: Record<string, string[]>;
        };
      }
  >;
}

export function createTaskRepository(_db: DB): TaskRepository {
  return {
    async findMany({ completed, limit, q }) {
      try {
        const rows = await _db.query.tasks.findMany({
          where: {
            completed,
            title: q ? { like: `%${q}%` } : undefined,
          },
          orderBy: { createdAt: "desc" },
          limit,
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
    async create(data) {
      try {
        const createdTask = await _db
          .insert(tasks)
          .values(data)
          .returning()
          .get();

        return {
          ok: true,
          data: createdTask,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          error: {
            code: "500",
            message: "Noe gikk galt i databasen",
            fieldErrors: {},
          },
        };
      }
    },
    async findById(id) {
      try {
        const task = await _db
          .select()
          .from(tasks)
          .where(eq(tasks.id, id))
          .get();

        return {
          ok: true,
          data: task ?? null,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          error: {
            code: "500",
            message: "Noe gikk galt i databasen",
            fieldErrors: {},
          },
        };
      }
    },
    async remove(id) {
      try {
        await _db.delete(tasks).where(eq(tasks.id, id));

        return {
          ok: true,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          error: {
            code: "500",
            message: "Noe gikk galt i databasen",
            fieldErrors: {},
          },
        };
      }
    },
    async update(id, data) {
      try {
        const updatedTask = await _db
          .update(tasks)
          .set(data)
          .where(eq(tasks.id, id))
          .returning()
          .get();

        return {
          ok: true,
          data: updatedTask ?? null,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          error: {
            code: "500",
            message: "Noe gikk galt i databasen",
            fieldErrors: {},
          },
        };
      }
    },
  };
}

export const repository = createTaskRepository(db);
