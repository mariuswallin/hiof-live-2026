import { afterEach, describe, expect, test, vi } from "vitest";

import { createTask, listTasks } from "@/api/tasks";

/**
 * ENHETSTEST av API-kallene - uten at webappen trenger å kjøre.
 *
 * vi.stubGlobal bytter ut den globale fetch med en spion. Da kan vi:
 * - bestemme hva "serveren" svarer
 * - sjekke HVA appen sendte (URL, metode, body)
 */
function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listTasks", () => {
  test("henter lista og plukker ut feltene appen bruker", async () => {
    const fetchMock = mockFetch(200, {
      ok: true,
      data: [
        {
          id: "abc",
          title: "Lese",
          completed: false,
          dueDate: null,
          createdAt: "2026-10-22T10:00:00.000Z",
        },
      ],
    });

    const tasks = await listTasks();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5173/api/v1/tasks");
    // dueDate og createdAt er borte - z.object() kaster ukjente felt.
    expect(tasks).toEqual([{ id: "abc", title: "Lese", completed: false }]);
  });

  test("kaster når serveren svarer med feil", async () => {
    mockFetch(500, { ok: false, error: { code: "500", message: "Database" } });

    await expect(listTasks()).rejects.toThrow("Kunne ikke hente oppgaver (500)");
  });
});

describe("createTask", () => {
  test("sender POST med JSON, og gir tilbake oppgaven serveren laget", async () => {
    const fetchMock = mockFetch(201, {
      ok: true,
      data: {
        id: "fra-serveren",
        title: "Skrive obligen",
        completed: false,
        dueDate: null,
        createdAt: "2026-10-22T10:00:00.000Z",
      },
    });

    const task = await createTask({ title: "Skrive obligen", completed: false });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5173/api/v1/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Skrive obligen", completed: false }),
    });
    // id-en kommer fra serveren, ikke fra appen.
    expect(task.id).toBe("fra-serveren");
  });

  test("kaster med feltfeilen fra serveren ved 400", async () => {
    mockFetch(400, {
      ok: false,
      error: {
        code: "400",
        message: "Ikke gyldig data",
        fieldErrors: { title: ["Tittel kan være maks 200 tegn"] },
      },
    });

    await expect(
      createTask({ title: "x".repeat(201), completed: false }),
    ).rejects.toThrow("Tittel kan være maks 200 tegn");
  });
});
