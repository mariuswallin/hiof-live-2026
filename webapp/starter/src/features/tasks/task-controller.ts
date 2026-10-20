// Her tar vi i mot requesten
// Her kan vi hente ut bruker fra context og jobbe med den
// (i tilfelle vi vil sende deg ut med 401 eller 403 med en gang)

import type { RequestInfo } from "rwsdk/worker";
import { taskService } from "./task-service";

// Her validerer vi at minium med required data er oppfylt (eks. tittel > 10)
// Her sender vi en Response tilbake med et gitt format {ok: true, data: }
// eller {ok: false: error: {}}

// Her importerer vi service og sender data videre til den

export interface TaskController {
  list(): Promise<any>;
  get(): Promise<any>;
  create(requestInfo: RequestInfo): Promise<Response>;
  update(): Promise<any>;
  action(): Promise<any>;
  remove(): Promise<any>;
}

export function createTaskController(service: any): TaskController {
  return {
    async list() {
      // Her vil jeg gjøre en enkel validering
      // Her vil jeg kalle service.list() med nødvendig parametre
      // Her vil jeg returnere en response
    },
    async get() {},
    async create({ request, ctx }) {
      let body: unknown;
      try {
        body = await request.json();
      } catch (error) {
        return Response.json(
          {
            ok: false,
            error: {
              code: 400,
              message: "Body må være av typen json",
              fieldErrors: {},
            },
          },
          {
            status: 400,
          },
        );
      }

      const result = await taskService.create({ id: 1 }, body);

      return result.ok
        ? Response.json(result, { status: 201 })
        : Response.json(result, {
            status: result.error.code,
          });
    },
    async update() {},
    async remove() {},
    async action() {},
  };
}

export const taskController = createTaskController(taskService);
