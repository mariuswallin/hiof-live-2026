// Her tar vi i mot request og håndterer den samt sender response tilbake

import type { RequestInfo } from "rwsdk/worker";
import { type TaskService, service } from "./task-service";
import { parseParams } from "./utils/parse-params";

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
    async remove({ request, ctx }: RequestInfo) {
      const data = await _service.remove();
      return null;
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
