// Her har vi bedriftslogikken vår. Det vil si det som er spesifikt for den konkrete
// feature vi jobber med
// Denne er fristilt fra databasen og request / response (http-laget)
// Stort sett kun ren typescript, validering, auth sjekk m.m

import z from "zod";
import { isAdmin, type SessionUser } from "@/features/auth/auth-types";
import { toTaskDTO, type TaskDTO } from "./task-mapper";
import { type TaskRepository, repository } from "./task-repository";
import { createTaskSchema, updateTaskSchema } from "./task-schema";
import type { Params } from "./utils/parse-params";
import { validateListParams } from "./utils/validate-list-params";
import { validateTask } from "./utils/validate-task";

export interface TaskService {
  create(
    input: unknown,
    user: SessionUser | null,
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
  findById(id: string): Promise<
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
    params: Params,
    user: SessionUser | null,
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
  remove(
    id: string,
    user: SessionUser | null,
  ): Promise<
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
    input: unknown,
    user: SessionUser | null,
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

  return {
    async list(params, user) {
      // Lista er per bruker, så vi må vite hvem som spør.
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

      // Admin ser oppgavene til alle. Andre ser bare sine egne. Hvem det
      // er, kommer fra innloggingen (ctx.user), aldri fra URL-en.
      const result = await _repository.findMany({
        ...paramsValidationResult.params,
        userId: isAdmin(user) ? undefined : user.id,
      });

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        data: result.data.map((task) => toTaskDTO(task, task.user)),
      };
    },
    async create(input, user) {
      // Tilgang først. En server action går ikke gjennom requireUser på ruta,
      // så servicen kan ikke stole på at noen andre har sjekket.
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

      // Eieren er den som er innlogget, ikke noe klienten sender inn.
      const result = await _repository.create({
        ...parsed.data,
        userId: user.id,
      });

      if (!result.ok) return result;

      return {
        ok: true,
        data: toTaskDTO(result.data, user),
      };
    },
    async findById(id) {
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

      return {
        ok: true,
        data: toTaskDTO(result.data, result.data.user),
      };
    },
    async remove(id, user) {
      // Tilgang FØR vi slår opp oppgaven. Ellers kan en uinnlogget bruker
      // finne ut hvilke id-er som finnes (404 mot 401).
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

      // Innlogget, men ikke admin: 403. Samme regel som requireAdmin på ruta.
      if (!isAdmin(user)) {
        return {
          ok: false,
          error: {
            code: "403",
            message: `${user.email} er ikke admin`,
            fieldErrors: {},
          },
        };
      }

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
    async update(id, input, user) {
      // Tilgang først: må være innlogget.
      //
      // TANKE: Enhver innlogget bruker kan endre ENHVER oppgave, hvis de
      // kjenner id-en. Lista viser bare dine egne, men det er ikke en sperre.
      // Hvordan ville du sjekket at oppgaven er din, eller at du er admin?
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

      // 4. Lagre. Feiler databasen (500), sender vi feilen rett videre.
      const result = await _repository.update(id, parsed.data);
      if (!result.ok) return result;

      // 5. Ingen rad ble endret, altså finnes ikke oppgaven.
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
        data: toTaskDTO(result.data, result.data.user),
      };
    },
  };
}

export const service = createTaskService(repository);
