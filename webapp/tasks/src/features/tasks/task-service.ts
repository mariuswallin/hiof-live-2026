// Her har vi bedriftslogikken vår. Det vil si det som er spesifikt for den konkrete
// feature vi jobber med
// Denne er fristilt fra databasen og request / response (http-laget)
// Stort sett kun ren typescript, validering, auth sjekk m.m

import z from "zod";
import { toTaskDTO, type TaskDTO } from "./task-mapper";
import { type TaskRepository, repository } from "./task-repository";
import { createTaskSchema, updateTaskSchema } from "./task-schema";
import type { Params } from "./utils/parse-params";
import { validateListParams } from "./utils/validate-list-params";
import { validateTask } from "./utils/validate-task";
import { isAdmin, type SessionUser } from "../auth/auth-types";
import type { Task } from "@/db/schema";

export interface TaskService {
  create(
    user: SessionUser | null,
    input: unknown,
  ): Promise<
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
  findById(
    user: SessionUser | null,
    id: string,
  ): Promise<
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
  list(
    user: SessionUser | null,
    params?: Params,
  ): Promise<
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
    user: SessionUser | null,
    id: string,
    input: unknown,
  ): Promise<
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
}

export function createTaskService(_repository: TaskRepository): TaskService {
  const findTask = (id: string) => _repository.findById(id);

  // Eieren eller en admin. Samme regel for å lese og for å endre én oppgave.
  const canAccess = (user: SessionUser, task: Task) =>
    task.userId === user.id || isAdmin(user);

  return {
    async list(user, params = {}) {
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

      // Admin ser alle oppgavene, andre bare sine egne.
      const result = await _repository.findMany({
        ...paramsValidationResult.params,
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
    async create(user, input) {
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
    async findById(user, id) {
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

      const result = await _repository.findById(id);

      if (!result.ok) return result;

      if (!result.data) {
        return {
          ok: false,
          error: {
            code: "404",
            message: "Task finnes ikke",
            fieldErrors: {},
          },
        };
      }

      // Vi vet hvem du er (ikke 401), men oppgaven er ikke din: 403.
      if (!canAccess(user, result.data)) {
        return {
          ok: false,
          error: {
            code: "403",
            message: "Du har ikke tilgang til denne oppgaven",
            fieldErrors: {},
          },
        };
      }

      return {
        ok: true,
        data: toTaskDTO(result.data),
      };
    },
    async remove(id) {
      const taskExist = await findTask(id);

      if (!taskExist.ok) return taskExist;
      if (!taskExist.data) {
        return {
          ok: false,
          error: {
            code: "404",
            message: "Task finnes ikke",
            fieldErrors: {},
          },
        };
      }

      const result = await _repository.remove(id);
      if (!result.ok) return result;

      return {
        ok: true,
      };
    },
    async update(user, id, input) {
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

      // 1. Alle felt er valgfrie (partial), så { completed: true }
      // holder. Zod fjerner felt den ikke kjenner, som id og userId.
      const parsed = updateTaskSchema.safeParse(input);
      if (!parsed.success)
        return {
          ok: false,
          error: {
            code: "400",
            message: "Feil med data",
            fieldErrors: z.flattenError(parsed.error).fieldErrors,
          },
        };

      // 2. Ingen felt å endre, for eksempel en tom body {}.
      if (Object.keys(parsed.data).length === 0) {
        return {
          ok: false,
          error: {
            code: "400",
            message: "Ingen felt å oppdatere",
            fieldErrors: {},
          },
        };
      }

      // 3. Samme regler som create. validateTask sjekker bare feltene som er med.
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

      // 4. Finnes oppgaven, og er den din? Sjekkes FØR vi lagrer.
      const existing = await findTask(id);
      if (!existing.ok) return existing;

      if (!existing.data) {
        return {
          ok: false,
          error: {
            code: "404",
            message: "Task finnes ikke",
            fieldErrors: {},
          },
        };
      }

      if (!canAccess(user, existing.data)) {
        return {
          ok: false,
          error: {
            code: "403",
            message: "Du har ikke tilgang til denne oppgaven",
            fieldErrors: {},
          },
        };
      }

      // 5. Lagre. Feiler databasen (500), sender vi feilen rett videre.
      const result = await _repository.update(id, parsed.data);
      if (!result.ok) return result;

      // 6. Ingen rad ble endret, for eksempel slettet i mellomtiden.
      if (!result.data) {
        return {
          ok: false,
          error: {
            code: "404",
            message: "Task finnes ikke",
            fieldErrors: {},
          },
        };
      }

      return {
        ok: true,
        data: toTaskDTO(result.data),
      };
    },
  };
}

export const service = createTaskService(repository);
