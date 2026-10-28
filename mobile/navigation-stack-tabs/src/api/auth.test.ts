import { afterEach, describe, expect, test, vi } from "vitest";

import { login } from "@/api/auth";

/**
 * ENHETSTEST av innloggingen - samme oppskrift som tasks.test.ts: fetch
 * byttes ut med en spion, så webappen trenger ikke å kjøre.
 */
function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login", () => {
  test("sender userId, og gir tilbake tokenet og brukeren fra webappen", async () => {
    const fetchMock = mockFetch(200, {
      ok: true,
      data: {
        token: "1",
        user: {
          id: 1,
          name: "Kari Nordmann",
          email: "kari@example.com",
          role: "admin",
        },
      },
    });

    const result = await login(1);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5173/api/v1/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: 1 }),
    });
    expect(result.token).toBe("1");
    // Rollen kommer fra webappen - appen bestemmer den ikke selv.
    expect(result.user.role).toBe("admin");
  });

  test("kaster med meldingen fra webappen ved ukjent bruker", async () => {
    mockFetch(400, {
      ok: false,
      error: {
        code: "400",
        message: "Ugyldig innlogging",
        fieldErrors: { userId: ["Brukeren finnes ikke"] },
      },
    });

    await expect(login(99)).rejects.toThrow("Ugyldig innlogging");
  });

  test("kaster når rollen er noe appen ikke kjenner", async () => {
    mockFetch(200, {
      ok: true,
      data: {
        token: "1",
        user: {
          id: 1,
          name: "Kari",
          email: "kari@example.com",
          role: "superadmin",
        },
      },
    });

    // zod stopper det før det havner i AuthContext.
    await expect(login(1)).rejects.toThrow();
  });
});
