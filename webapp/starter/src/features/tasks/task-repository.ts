import type { DB } from "@/db";

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
      db.insert(task);
    }, // implement thi,
    list: () => {
      // her skriver jeg ren sql
    },
    get: (id) => {
      // her bruker prisma
    },
  };
}

//
const repository = createTaskRepository();

repository.create({ title: "My Task", description: "This is my task" });
