// Her har vi bedriftslogikken vår. Det vil si det som er spesifikt for den konkrete
// feature vi jobber med
// Denne er fristilt fra databasen og request / response (http-laget)
// Stort sett kun ren typescript, validering, auth sjekk m.m

import z from "zod";
import { toTaskDTO, type TaskDTO } from "./task-mapper";
import { type TaskRepository, repository } from "./task-repository";
import { createTaskSchema } from "./task-schema";
import type { Params } from "./utils/parse-params";
import { validateListParams } from "./utils/validate-list-params";
import { validateTask } from "./utils/validate-task";

export interface TaskService {
  create(input: unknown): Promise<
    | {
        ok: true;
        data: TaskDTO;
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
  findById(id: string): Promise<TaskDTO | null>;
  list(params?: Params): Promise<
    | {
        ok: true;
        data: TaskDTO[];
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
  remove(id: string): Promise<void>;
  update(id: string, input: unknown): Promise<TaskDTO | null>;
}

export function createTaskService(_repository: TaskRepository): TaskService {
  return {
    async list(params = {}) {
      const paramsValidationResult = validateListParams(params);
      if (!paramsValidationResult.ok) {
        return {
          ok: false,
          error: {
            code: "400",
            message: "Ugyldig parameter",
            fieldErrors: {
              [paramsValidationResult.field]: [paramsValidationResult.error],
            },
          },
        };
      }

      const result = await _repository.findMany(paramsValidationResult.params);

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        data: result.data.map(toTaskDTO),
      };
    },
    async create(input) {
      const parsed = createTaskSchema.safeParse(input);
      if (!parsed.success)
        return {
          ok: false,
          error: {
            code: "400",
            message: "Feil med data",
            fieldErrors: z.flattenError(parsed.error).fieldErrors,
          },
        };

      const rule = validateTask(parsed.data);

      if (!rule.ok) {
        return {
          ok: false,
          error: {
            code: "400",
            message: "Ikke gyldig data",
            fieldErrors: { [rule.field]: [rule.error] },
          },
        };
      }

      const result = await _repository.create({ ...parsed.data, userId: 1 });

      if (!result.ok) return result;

      return {
        ok: true,
        data: toTaskDTO(result.data),
      };
    },
    async findById(id) {
      const data = await _repository.findById(id);
      return null;
    },
    async remove(id) {
      const data = await _repository.remove(id);
      return null;
    },
    async update(id, input) {
      const data = await _repository.update(id, input);
      return null;
    },
  };
}

export const service = createTaskService(repository);
