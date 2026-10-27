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
import { isAdmin, type SessionUser } from "../auth/auth-types";

export interface TaskService {
  list(user: SessionUser | null): Promise<any>;
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

// export interface BaseService<T> {
//   list(user: T): Promise<T>
// }

// interface A extends BaseService<User> {

// }

// interface B extends BaseService<Tasks> {}

export function createTaskService(_repository: TaskRepository): TaskService {
  return {
    async list(user) {
      // Her parser vi kanskje noen query params som vi har fått inn som data
      // Her sjekker vi kanskje rolle
      // Her kaller vi repository.findMany()
      // Her returnerer vi resultatet av det vi fikk fra repository
      if (!user) {
        return {
          ok: false,
          error: {
            code: "401",
            message: "Du må være innlogget",
            fieldErrors: {},
          },
        };
      }
      const result = await _repository.list({
        userId: isAdmin(user) ? undefined : user.id,
      });

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        data: result.data.map(toTaskDTO),
      };
    },
    async get(user, id) {},
    async create(user, data) {
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

      // const rule = validateTask(parsed.data)
      // if (!rule.ok) {

      // }

      console.log(user.id);

      const result = await _repository.create({
        ...parsed.data,
        userId: user.id,
      });

      if (!result.ok) return result;

      return {
        ok: true,
        data: toTaskDTO(result.data),
      };
    },
    async update(user, id, input) {},
    async remove(user, id) {},
  };
}

export const taskService = createTaskService(taskRepository);
