// Her kommer bedriftslogikken vår
// Her importerer vi Repository
// Her validerer vi mot "Task" spesifikk logikk
// Her sjekker vi om du får lov til det du prøver å gjøre
// Her mapper vi muligens data for å ha en konsistent struktur
// Her tilgjengeligjør vi funksjonalitet som "actions.ts" og "controller" trenger

import z from "zod";
import { toTaskDTO, type TaskDTO } from "./task-mapper";
import { taskRepository, type TaskRepository } from "./task-repository";
import { createTaskSchema } from "./task-validator";

export interface TaskService {
  list(user: any): Promise<any>;
  get(user: any, id: string): Promise<any>;
  create(
    user: any,
    input: unknown,
  ): Promise<
    | {
        ok: true;
        data: TaskDTO;
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
  update(user: any, id: string, input: any): Promise<any>;
  remove(user: any, id: string): Promise<any>;
}

export function createTaskService(_repository: TaskRepository): TaskService {
  return {
    async list(user) {
      // Her parser vi kanskje noen query params som vi har fått inn som data
      // Her sjekker vi kanskje rolle
      // Her kaller vi repository.findMany()
      // Her returnerer vi resultatet av det vi fikk fra repository
    },
    async create(user, data: unknown) {
      const parsed = createTaskSchema.safeParse(data);
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: 400,
            message: "Ugyldig data",
            fieldErrors: z.flattenError(parsed.error).fieldErrors,
          },
        };
      }

      const { duedate, ...taskData } = parsed.data;
      const result = await _repository.create({
        ...taskData,
        dueDate: duedate,
        userId: user.id,
      });

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        data: toTaskDTO(result.data),
      };
    },
    async get(user, id) {
      throw new Error("Not implemented");
    },
    async update(user, id, input) {
      throw new Error("Not implemented");
    },
    async remove(user, id) {
      throw new Error("Not implemented");
    },
  };
}

export const taskService = createTaskService(taskRepository);
