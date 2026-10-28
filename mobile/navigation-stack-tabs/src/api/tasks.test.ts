import { afterEach, describe, expect, test, vi } from "vitest";

import { createTask, getTask, listTasks } from "@/api/tasks";

/**
 * ENHETSTEST av API-kallene - uten at webappen trenger å kjøre.
 *
 * vi.stubGlobal bytter ut den globale fetch med en spion. Da kan vi:
 * - bestemme hva "serveren" svarer
 * - sjekke HVA appen sendte (URL, metode, headere, body)
 *
 * Tokenet er det POST /api/v1/login ga oss (se auth.test.ts). I webappen
 * er det bare bruker-id-en, så "2" = Ola.
 */
const TOKEN = "2";
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

    const tasks = await listTasks(TOKEN);

    // Tokenet MÅ være med - uten svarer webappen 401.
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5173/api/v1/tasks",
      { headers: { authorization: "Bearer 2" } },
    );
    // dueDate og createdAt er borte - z.object() kaster ukjente felt.
    expect(tasks).toEqual([{ id: "abc", title: "Lese", completed: false }]);
  });

  test("kaster når serveren svarer med feil", async () => {
    mockFetch(500, { ok: false, error: { code: "500", message: "Database" } });

    await expect(listTasks(TOKEN)).rejects.toThrow(
      "Kunne ikke hente oppgaver (500)",
    );
  });

  test("kaster når webappen ikke godtar tokenet (401)", async () => {
    mockFetch(401, {
      ok: false,
      error: { code: "401", message: "Du må være innlogget", fieldErrors: {} },
    });

    await expect(listTasks("finnes-ikke")).rejects.toThrow(
      "Kunne ikke hente oppgaver (401)",
    );
  });
});

describe("getTask", () => {
  test("henter én oppgave med tokenet i headeren", async () => {
    const fetchMock = mockFetch(200, {
      ok: true,
      data: { id: "abc", title: "Lese", completed: true },
    });

    const task = await getTask(TOKEN, "abc");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5173/api/v1/tasks/abc",
      { headers: { authorization: "Bearer 2" } },
    );
    expect(task).toEqual({ id: "abc", title: "Lese", completed: true });
  });

  test("kaster når oppgaven er en annens (403)", async () => {
    mockFetch(403, { ok: false, error: { code: "403", message: "Ikke din" } });

    await expect(getTask(TOKEN, "abc")).rejects.toThrow(
      "Kunne ikke hente oppgave abc (403)",
    );
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

    const task = await createTask(TOKEN, {
      title: "Skrive obligen",
      completed: false,
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5173/api/v1/tasks", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer 2",
      },
      // Ingen eier i bodyen - webappen finner den fra tokenet.
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
      createTask(TOKEN, { title: "x".repeat(201), completed: false }),
    ).rejects.toThrow("Tittel kan være maks 200 tegn");
  });
});
