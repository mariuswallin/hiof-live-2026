// Her tar vi i mot request og håndterer den samt sender response tilbake

import type { RequestInfo } from "rwsdk/worker";
import { type TaskService, service } from "./task-service";
import { parseParams } from "./utils/parse-params";
import { demoDelay, demoFailure } from "@/lib/demo-chaos";

export interface TaskController {
  create(requestInfo: RequestInfo): Promise<Response>;
  find(requestInfo: RequestInfo): Promise<Response>;
  list(requestInfo: RequestInfo): Promise<Response>;
  remove(requestInfo: RequestInfo): Promise<Response>;
  action(requestInfo: RequestInfo): Promise<Response>;
  update(requestInfo: RequestInfo): Promise<Response>;
}

export function createTaskController(_service: TaskService): TaskController {
  return {
    async list({ request, ctx }: RequestInfo) {
      // ?completed=true
      const params = parseParams(request);
      const result = await _service.list(params);

      if (!result.ok) {
        return Response.json(
          {
            ok: false,
            error: result.error,
          },
          {
            status: Number(result.error.code),
          },
        );
      }

      return Response.json(
        {
          ok: true,
          data: result.data,
        },
        {
          status: 200,
        },
      );
    },
    // POST /api/v1/tasks med JSON, f.eks. { "title": "Lese" }
    async create({ request, ctx }: RequestInfo) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            error: {
              code: "400",
              message: "Body må være JSON",
              fieldErrors: {},
            },
          },
          { status: 400 },
        );
      }

      const result = await _service.create(body);

      // ok: true 201 (opprettet), ellers 400 eller 500 fra servicen.
      return result.ok
        ? Response.json(result, {
            status: 201,
          })
        : Response.json(result, {
            status: Number(result.error.code),
          });
    },
    // GET /api/v1/tasks/:id
    async find({ params }: RequestInfo) {
      const result = await _service.findById(params.id);

      // ok: true 200, ellers 404 (finnes ikke) eller 500 (databasen).
      return result.ok
        ? Response.json(result, {
            status: 200,
          })
        : Response.json(result, {
            status: Number(result.error.code),
          });
    },
    // DELETE /api/v1/tasks/:id
    async remove({ request, params, ctx }: RequestInfo) {
      await demoDelay(request, 1000);
      const chaos = demoFailure(request);

      if (chaos) {
        return Response.json(
          {
            ok: false,
            error: chaos,
          },
          { status: 500 },
        );
      }

      const result = await _service.remove(params.id);

      // ok: true 204 (ingen body), ellers 404 eller 500 fra servicen.
      return result.ok
        ? new Response(null, {
            status: 204,
          })
        : Response.json(result, {
            status: Number(result.error.code),
          });
    },
    // PATCH /api/v1/tasks/:id med JSON, f.eks. { "completed": true }
    async update({ request, params }: RequestInfo) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            error: {
              code: "400",
              message: "Body må være JSON",
              fieldErrors: {},
            },
          },
          { status: 400 },
        );
      }

      const result = await _service.update(params.id, body);

      // Det servicen kan svare, og statusen vi sender:
      //   ok: true   200  den oppdaterte oppgaven
      //   "400"      400  feil form, ingen felt, eller brudd på reglene
      //   "404"      404  ingen oppgave med denne id-en
      //   "500"      500  noe gikk galt i databasen
      return result.ok
        ? Response.json(result, {
            status: 200,
          })
        : Response.json(result, {
            status: Number(result.error.code),
          });
    },
    // POST /api/v1/tasks/:id/:action, f.eks. /api/v1/tasks/abc/complete
    //
    // En HANDLING på én oppgave, i stedet for å sende feltene selv:
    //   PATCH /api/v1/tasks/abc   { "completed": true }   endre et felt
    //   POST  /api/v1/tasks/abc/complete                 "fullfør denne"
    //
    // Fordelen: klienten trenger ikke vite hvilke felt som endres, og hver
    // handling kan ha sine egne regler i servicen.
    //
    // IKKE FERDIG. Å gjøre:
    //   1. params.action er hvilken som helst tekst fra URL-en. Sjekk den mot
    //      handlingene vi støtter ("complete", "reopen"). Ukjent gir 404.
    //   2. Kall servicen, f.eks. _service.update(params.id, { completed: true }).
    //   3. Send svaret med samme status som update (200, 400, 404, 500).
    async action({ request, ctx }: RequestInfo) {
      const data = await _service.update();
      return null;
    },
  };
}

export const controller = createTaskController(service);
