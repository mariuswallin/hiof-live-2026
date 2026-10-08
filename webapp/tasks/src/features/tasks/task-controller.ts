import type { RequestInfo } from "rwsdk/worker";
import { demoDelay, demoFailure } from "@/lib/demo-chaos";
import {
  codeToStatus,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/response";
import { Errors, ResultHandler, type Result } from "@/lib/result";
import { taskService, type TaskService } from "./task-service";
import { parseParams } from "./utils/parse-params";

/**
 * CONTROLLER: oversetter mellom HTTP og servicen.
 *
 *   inn:  Request (params, body, ctx.user)   ->  vanlige verdier
 *   ut:   Result fra servicen                ->  Response med riktig status
 *
 * Ingen forretningsregler, ingen tilgangsregler og ingen database her. Vil du
 * vite HVA som skjer og HVEM som får lov, les servicen. Vil du vite hvilken
 * STATUSKODE det blir, les denne.
 *
 * `ctx.user` sendes rett videre til servicen. Det er servicen som avgjør.
 *
 * Hver metode tar `RequestInfo`, det samme som en rwsdk-handler får. Da kan
 * de settes rett inn i route(...) i task-routes.ts.
 *
 * Samme mønster som TaskRepository og TaskService: interfacet sier HVA
 * controlleren kan, factoryen under sier HVORDAN. Rutene kjenner bare
 * interfacet.
 */
export interface TaskController {
  /** GET /api/tasks?completed=false&q=oblig&limit=5 */
  list(requestInfo: RequestInfo): Promise<Response>;
  /** GET /api/tasks/:id */
  get(requestInfo: RequestInfo): Promise<Response>;
  /** POST /api/tasks */
  create(requestInfo: RequestInfo): Promise<Response>;
  /** PUT /api/tasks/:id */
  update(requestInfo: RequestInfo): Promise<Response>;
  /** POST /api/tasks/:id/:action  (complete / uncomplete) */
  action(requestInfo: RequestInfo): Promise<Response>;
  /** DELETE /api/tasks/:id */
  remove(requestInfo: RequestInfo): Promise<Response>;
}

export function createTaskController(service: TaskService): TaskController {
  /** Gir svaret: feil blir feilrespons, suksess blir 200 (eller det du ber om). */
  const respond = <T>(
    result: Result<T>,
    status = 200,
    headers?: HeadersInit,
  ) =>
    result.success
      ? createSuccessResponse(result.data, { status, headers })
      : createErrorResponse(result.error);

  /**
   * Leser JSON-bodyen. Selve feltene valideres i servicen, men ugyldig JSON
   * er et HTTP-problem og hører hjemme her.
   */
  const readJson = async (request: Request): Promise<Result<unknown>> => {
    try {
      return ResultHandler.success(await request.json());
    } catch {
      return ResultHandler.failure("Ugyldig JSON", Errors.BAD_REQUEST);
    }
  };

  return {
    /**
     * GET /api/tasks?completed=false&q=oblig&limit=5  200 / 400
     *
     * Skrevet ut UTEN `respond`, så du ser hele veien fra Request til
     * Response. Metodene under gjør det samme via `respond`.
     */
    async list({ request, ctx }: RequestInfo) {
      // URL -> { completed: "false", q: "oblig", limit: "5" }. Fortsatt tekst.
      // Om verdiene er lovlige, avgjør servicen.
      const params = parseParams(request);

      const result = await service.list(ctx.user, params);

      if (!result.success) {
        return Response.json(
          { success: false, error: result.error },
          {
            // BAD_REQUEST -> 400, INTERNAL_SERVER_ERROR -> 500. Tabellen
            // står i lib/response.ts.
            status: codeToStatus(result.error.code),
            // Feil skal aldri caches. Neste forsøk kan gå bra.
            headers: { "Cache-Control": "no-store" },
          },
        );
      }

      return Response.json(
        { success: true, data: result.data },
        { status: 200 },
      );
    },

    /** GET /api/tasks/:id  200 / 404 */
    async get({ params, ctx }: RequestInfo) {
      return respond(await service.get(ctx.user, params.id));
    },

    /**
     * POST /api/tasks  201 / 400 / 401
     *
     * 201 skal fortelle hvor den nye ressursen ligger. Derfor `Location`, og
     * derfor sender vi raden tilbake: id-en er det serveren som lager.
     */
    async create({ request, ctx }: RequestInfo) {
      const body = await readJson(request);
      if (!body.success) return createErrorResponse(body.error);

      const result = await service.create(ctx.user, body.data);

      return result.success
        ? respond(result, 201, { Location: `/api/tasks/${result.data.id}` })
        : respond(result);
    },

    /** PUT /api/tasks/:id  200 / 400 / 401 / 404 */
    async update({ request, params, ctx }: RequestInfo) {
      const body = await readJson(request);
      if (!body.success) return createErrorResponse(body.error);

      return respond(await service.update(ctx.user, params.id, body.data));
    },

    /**
     * POST /api/tasks/:id/:action  200 / 400 / 404
     *
     * En "action"-rute: et verb i URL-en i stedet for en ressurs. Må være
     * POST: en GET skal aldri endre data, og nettlesere og lenkeforhåndslastere
     * fyrer av GET-forespørsler på egen hånd.
     */
    async action({ params, ctx }: RequestInfo) {
      const actions: Record<string, boolean> = {
        complete: true,
        uncomplete: false,
      };

      // Object.hasOwn, ikke `params.action in actions`: `in` slipper
      // gjennom arvede nøkler som "toString".
      if (!Object.hasOwn(actions, params.action)) {
        return createErrorResponse({
          code: Errors.BAD_REQUEST,
          message: `Ukjent handling: ${params.action}`,
        });
      }

      return respond(
        await service.update(ctx.user, params.id, {
          completed: actions[params.action],
        }),
      );
    },

    /**
     * DELETE /api/tasks/:id  204 / 401 / 403 / 404
     *
     * 204 betyr "ok, og jeg har ingenting å sende tilbake". Statusen KAN ikke
     * ha body: gir du den en, kaster runtime en feil. Derfor ikke `respond`.
     */
    async remove({ request, params, ctx }: RequestInfo) {
      // Demo: oppgaven forsvinner med én gang, og kommer tilbake ved 500.
      await demoDelay(request, 1000);
      const chaos = demoFailure(request);
      if (chaos) return createErrorResponse(chaos);

      const result = await service.remove(ctx.user, params.id);
      if (!result.success) return createErrorResponse(result.error);

      return new Response(null, { status: 204 });
    },
  };
}

// Instansen rutene bruker. Kjeden er nå komplett:
//   db -> taskRepository -> taskService -> taskController
export const taskController = createTaskController(taskService);
