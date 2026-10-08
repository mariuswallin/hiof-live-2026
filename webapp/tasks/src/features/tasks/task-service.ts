import { z } from "zod";
import type { Task } from "@/db/schema";
import type { SessionUser } from "@/features/auth/auth-types";
import { Errors, ResultHandler, type Result } from "@/lib/result";
import { toTaskDTO, type TaskDTO } from "./task-mapper";
import { taskRepository, type TaskRepository } from "./task-repository";
import { createTaskSchema, updateTaskSchema } from "./task-schema";
import type { Params } from "./utils/parse-params";
import { validateListParams } from "./utils/validate-list-params";
import { validateTask, type TaskValidation } from "./utils/validate-task";

/**
 * SERVICE: forretningsregler OG tilgang.
 *
 * Servicen vet ingenting om HTTP, Request, cookies eller FormData. Den tar
 * imot data, sjekker reglene og spør repositoryet. Derfor kan API-et, server
 * actions og server-komponenter bruke den, og reglene står ett sted.
 *
 * HVOR BOR AUTH-SJEKKEN?
 *
 * Her. Servicen har tre innganger, og bare én av dem går via mellomvaren:
 *
 *   API-rute          -> requireAdmin -> controller -> service
 *   server action     ------------------------------> service
 *   server-komponent  ------------------------------> service
 *
 * Lå sjekken bare i mellomvaren, kunne en ny side eller action som "glemte"
 * den lese eller slette fritt. Derfor tar hver metode `user` som FØRSTE,
 * PÅKREVDE parameter. `taskService.remove(id)` kompilerer ikke. Hver kaller
 * MÅ ta stilling til hvem som spør, også når svaret er `null`.
 *
 *   mellomvare (setUser)   hvem er du       autentisering
 *   service                får du lov       autorisasjon  <- garantien
 *   requireAdmin på ruta   tidlig 403       ekstra sperre, valgfri
 *   UI                     skjul knappen    brukeropplevelse
 *
 * Servicen returnerer TaskDTO, ikke Task. Mappingen skjer her, så ingen
 * kaller får tak i hele databaseraden. Se task-mapper.ts.
 *
 * Inndata er `unknown` med vilje. Servicen er grensen inn til domenet og
 * validerer selv. Da kan ingen kaller "glemme" å validere.
 *
 * TANKE (policy): Regelen "bare admin kan slette" står i remove under. Men
 * TaskList vil også vite den, for å skjule slett-knappen. Skriver vi
 * `user?.role === "admin"` begge steder, er de forskjellige en dag. Løsningen
 * er en `task-policy.ts` med rene funksjoner, for eksempel
 *   export const canDeleteTask = (user) => user?.role === "admin";
 * som både servicen og UI-et importerer. (Laravel Policies, Pundit, CASL.)
 * Når lønner det seg å lage den fila?
 *
 * TANKE (eierskap): I dag kan enhver innlogget bruker endre ENHVER oppgave.
 * Hvordan ville update sett ut hvis bare eieren (eller admin) skal få lov?
 * Hvorfor kan ikke mellomvaren sjekke det? (Hint: den har ikke oppgaven.)
 */
export interface TaskService {
  /** `params` er query-parametrene som tekst, rett fra parseParams. */
  list(user: SessionUser | null, params?: Params): Promise<Result<TaskDTO[]>>;
  get(user: SessionUser | null, id: string): Promise<Result<TaskDTO>>;
  create(user: SessionUser | null, input: unknown): Promise<Result<TaskDTO>>;
  update(
    user: SessionUser | null,
    id: string,
    input: unknown,
  ): Promise<Result<TaskDTO>>;
  remove(user: SessionUser | null, id: string): Promise<Result<void>>;
}

const unauthorized = () =>
  ResultHandler.failure<never>("Du må være innlogget", Errors.UNAUTHORIZED);

const forbidden = (user: SessionUser) =>
  ResultHandler.failure<never>(`${user.email} er ikke admin`, Errors.FORBIDDEN);

const notFound = (id: string) =>
  ResultHandler.failure<never>(
    `Fant ingen oppgave med id ${id}`,
    Errors.NOT_FOUND,
  );

const invalid = (error: z.ZodError) =>
  ResultHandler.failure<never>(
    "Ugyldige felter",
    Errors.BAD_REQUEST,
    z.flattenError(error).fieldErrors,
  );

/**
 * `{}` er gyldig form, fordi alt er valgfritt i updateTaskSchema. Men da er
 * det ingenting å endre, og Drizzle kaster "No values to set". Uten denne
 * sjekken får klienten 500 for noe som er klientens feil.
 */
const nothingToUpdate = () =>
  ResultHandler.failure<never>(
    "Send minst ett felt å endre: title, completed eller dueDate",
    Errors.BAD_REQUEST,
  );

/** Regelbrudd fra validateTask, i samme form som Zod-feilene over. */
const ruleBroken = (rule: Extract<TaskValidation, { ok: false }>) =>
  ResultHandler.failure<never>("Ugyldige felter", Errors.BAD_REQUEST, {
    [rule.field]: [rule.error],
  });

/** Gjør Result<Task> om til Result<TaskDTO>. Feil sendes videre som de er. */
const toDTOResult = (result: Result<Task>): Result<TaskDTO> =>
  result.success ? ResultHandler.success(toTaskDTO(result.data)) : result;

/**
 * Factory med dependency injection: repositoryet kommer inn som argument.
 * Servicen vet ikke om det er D1, SQLite i minnet eller en falsk versjon.
 */
export function createTaskService(repository: TaskRepository): TaskService {
  /** Intern: henter raden, og gjør `null` om til NOT_FOUND. */
  const findTask = async (id: string): Promise<Result<Task>> => {
    const result = await repository.findById(id);
    if (!result.success) return result;

    return result.data ? ResultHandler.success(result.data) : notFound(id);
  };

  return {
    /**
     * Skrevet ut UTEN hjelperne (invalid, ruleBroken, ResultHandler), så du
     * ser hele Result-formen. create under gjør det samme, bare kortere.
     *
     * Lesing er åpen i denne appen, så `user` brukes ikke ennå (derfor `_`).
     * Den står der likevel: den dagen lista skal filtreres på eier
     * (WHERE user_id = ?), sender alle kallere den allerede med.
     */
    async list(_user, params = {}) {
      // Tekst inn, typer ut: { completed: "false" } -> { completed: false }.
      // Samme jobb som Zod + validateTask gjør for create.
      const checked = validateListParams(params);
      if (!checked.ok) {
        return {
          success: false,
          error: {
            code: Errors.BAD_REQUEST,
            message: "Ugyldige parametere",
            fieldErrors: { [checked.field]: [checked.error] },
          },
        };
      }

      const result = await repository.findMany(checked.params);
      if (!result.success) return result;

      // Rad -> DTO. Ingen kaller får hele databaseraden.
      return { success: true, data: result.data.map(toTaskDTO) };
    },

    async get(_user, id) {
      return toDTOResult(await findTask(id));
    },

    async create(user, input) {
      if (!user) return unauthorized();

      // Først formen (Zod), så regelen (validateTask). To spørsmål, to steder.
      const parsed = createTaskSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);

      const rule = validateTask(parsed.data);
      if (!rule.ok) return ruleBroken(rule);

      // Eieren kommer fra den som spør, aldri fra input.
      return toDTOResult(
        await repository.create({ ...parsed.data, userId: user.id }),
      );
    },

    async update(user, id, input) {
      if (!user) return unauthorized();

      const parsed = updateTaskSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      if (Object.keys(parsed.data).length === 0) return nothingToUpdate();

      const rule = validateTask(parsed.data);
      if (!rule.ok) return ruleBroken(rule);

      // Uten null-sjekken svarer en update som traff null rader like blidt,
      // og klienten tror den endret noe som ikke finnes.
      const result = await repository.update(id, parsed.data);
      if (!result.success) return result;

      return result.data
        ? ResultHandler.success(toTaskDTO(result.data))
        : notFound(id);
    },

    async remove(user, id) {
      // Tilgang FØR vi slår opp oppgaven. Ellers kan en uinnlogget bruker
      // finne ut hvilke id-er som finnes, ved å se forskjell på 404 og 401.
      if (!user) return unauthorized();
      if (user.role !== "admin") return forbidden(user);

      const existing = await findTask(id);
      if (!existing.success) return existing;

      return repository.remove(id);
    },
  };
}

// Instansen appen bruker: server-komponenter, server actions og controlleren.
export const taskService = createTaskService(taskRepository);
