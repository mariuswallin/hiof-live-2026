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
    async create({ request, ctx }: RequestInfo) {
      const body = await request.json();
      const result = await _service.create(body);
      return result.ok
        ? Response.json(result, {
            status: 201,
          })
        : Response.json(result, {
            status: Number(result.error.code),
          });
    },
    async find({ request, ctx }: RequestInfo) {
      const data = await _service.find();
      return null;
    },

    async remove({ request, params, ctx }: RequestInfo) {
      await demoDelay(request, 1000);
      const chaos = demoFailure(request);

      if (chaos) {
        return {
          ok: false,
          error: chaos,
        };
      }

      const result = await _service.remove(params.id);

      return result.ok
        ? new Response(null, {
            status: 204,
          })
        : Response.json(result, {
            status: Number(result.error.code),
          });
    },
    async update({ request, ctx }: RequestInfo) {
      const data = await _service.update();
      return null;
    },
    async action({ request, ctx }: RequestInfo) {
      const data = await _service.update();
      return null;
    },
  };
}

export const controller = createTaskController(service);
