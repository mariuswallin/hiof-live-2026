// ENHETSTEST av controlleren. Ingen database og ingen server: servicen byttes
// ut med en falsk, akkurat som repositoryet byttes ut i task-service.test.ts.
//
//   appen:   createTaskController(taskService)
//   testen:  createTaskController(falskService)
//
// Controlleren skal bare oversette mellom HTTP og servicen. Derfor sjekker vi
// akkurat det: hva den sender INN til servicen, og hvilken STATUS og BODY som
// kommer UT. Om reglene stemmer, er servicetestens jobb.
import { describe, expect, it, vi } from "vitest";
import type { RequestInfo } from "rwsdk/worker";
import { DEMO_USERS } from "@/features/auth/demo-user";
import { ResultHandler } from "@/lib/result";
import { createTaskController } from "../task-controller";
import type { TaskDTO } from "../task-mapper";
import type { TaskService } from "../task-service";

const bruker = DEMO_USERS.bruker;

const task: TaskDTO = {
  id: "abc",
  title: "Skrive obligen",
  completed: false,
  dueDate: null,
  createdAt: "2026-10-05T12:00:00.000Z",
};

/** En service der alt er vi.fn. Testen bestemmer hva metodene svarer. */
function fakeService(fns: Partial<TaskService>): TaskService {
  return {
    list: vi.fn(fns.list),
    get: vi.fn(fns.get),
    create: vi.fn(fns.create),
    update: vi.fn(fns.update),
    remove: vi.fn(fns.remove),
  };
}

/**
 * Bare det controlleren leser: request og ctx. `as` er greit i en test, der
 * VI lager verdien. I appen kommer RequestInfo fra rwsdk.
 */
function requestInfo(body: string, user = bruker): RequestInfo {
  const request = new Request("http://localhost/api/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return { request, params: {}, ctx: { user } } as unknown as RequestInfo;
}

describe("taskController.create", () => {
  it("sender body og bruker til servicen, og svarer 201 med Location", async () => {
    const service = fakeService({
      create: async () => ResultHandler.success(task),
    });
    const controller = createTaskController(service);

    const response = await controller.create(
      requestInfo(JSON.stringify({ title: "Skrive obligen" })),
    );

    // Inn: controlleren sendte body-en urørt. Servicen validerer, ikke den.
    expect(service.create).toHaveBeenCalledWith(bruker, {
      title: "Skrive obligen",
    });

    // Ut: 201, hvor den nye ligger, og samme form som alle API-svar.
    expect(response.status).toBe(201);
    expect(response.headers.get("Location")).toBe("/api/tasks/abc");
    expect(await response.json()).toEqual({ success: true, data: task });
  });

  it("gjør feilkoden fra servicen om til riktig status", async () => {
    const service = fakeService({
      create: async () =>
        ResultHandler.failure("Ugyldige felter", "BAD_REQUEST", {
          title: ["Tittel kan ikke være tom"],
        }),
    });
    const controller = createTaskController(service);

    const response = await controller.create(
      requestInfo(JSON.stringify({ title: "" })),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { fieldErrors: { title: ["Tittel kan ikke være tom"] } },
    });
  });

  it("svarer 400 på ugyldig JSON uten å spørre servicen", async () => {
    const service = fakeService({
      create: async () => ResultHandler.success(task),
    });
    const controller = createTaskController(service);

    const response = await controller.create(requestInfo("ikke json"));

    expect(response.status).toBe(400);
    // Ugyldig JSON er et HTTP-problem. Servicen får aldri se det.
    expect(service.create).not.toHaveBeenCalled();
  });
});

describe("taskController.list", () => {
  it("parser query-parametrene og sender dem til servicen som tekst", async () => {
    const service = fakeService({
      list: async () => ResultHandler.success([task]),
    });
    const controller = createTaskController(service);
    const request = new Request(
      "http://localhost/api/tasks?completed=false&q=oblig",
    );

    const response = await controller.list({
      request,
      params: {},
      ctx: { user: null },
    } as unknown as RequestInfo);

    // Inn: tekst, rett fra URL-en. Om "false" er lovlig, avgjør servicen.
    expect(service.list).toHaveBeenCalledWith(null, {
      completed: "false",
      q: "oblig",
    });

    // Ut: 200 og samme form som alle API-svar.
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [task] });
  });
});
