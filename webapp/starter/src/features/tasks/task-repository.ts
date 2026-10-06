import { db, type DB } from "@/db";

export interface TaskRepository {
  create: (task: any) => Promise<any>;
  update: (id: string, task: any) => Promise<any>;
  get: (id: string) => Promise<any>;
  list: () => Promise<any>;
  remove: (id: string) => Promise<any>;
}

export function createTaskRepository(db: DB): TaskRepository {
  return {
    create: (task) => {
      return db.insert(tasks).values(task);
    },
    update: async (id, task) => {
      throw new Error("Not implemented");
    },
    get: async (id) => {
      throw new Error("Not implemented");
    },
    list: async () => {
      throw new Error("Not implemented");
    },
    remove: async (id) => {
    },
  };
}

//
export const taskRepository = createTaskRepository(db);

// repository.create({ title: "My Task", description: "This is my task" });
