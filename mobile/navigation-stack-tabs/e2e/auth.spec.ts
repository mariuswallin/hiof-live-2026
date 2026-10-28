import { expect, test, type Page } from "@playwright/test";

/**
 * E2E: hvor lenge "lever" innloggingen i AuthContext?
 *
 * Tokenet fra POST /api/v1/login ligger bare i minnet. Vi teller
 * innloggingene:
 *
 *   oppstart          -> /login, 0 innlogginger
 *   logg inn          -> 1
 *   navigere rundt    -> fortsatt 1 (provideren ligger over navigatoren)
 *   refresh (reload)  -> tilbake på /login (JS-minnet er tømt), logg inn = 2
 */

const API = "http://localhost:5173/api/v1";

/** Brukerne i webappens seed. Token = id-en, som i webappen. */
const USERS = {
  1: { id: 1, name: "Kari Nordmann", email: "kari@example.com", role: "admin" },
  2: { id: 2, name: "Ola Hansen", email: "ola@example.com", role: "user" },
} as const;

type MockTask = { id: string; title: string; completed: boolean };

/** Hver bruker har sin egen liste - admin ser alle, som i webappen. */
const TASKS_BY_TOKEN: Record<string, MockTask[]> = {
  "1": [
    { id: "k1", title: "Karis oppgave", completed: false },
    { id: "o1", title: "Olas oppgave", completed: false },
  ],
  "2": [{ id: "o1", title: "Olas oppgave", completed: false }],
};

/**
 * Mocker webappen og teller forespørslene, så testene kan sjekke HVOR MANGE
 * ganger appen logget inn og hentet lista - og med hvilket token.
 */
async function mockApi(page: Page) {
  const calls = { logins: 0, listTokens: [] as string[] };

  await page.route(`${API}/**`, (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/login") {
      calls.logins++;
      const { userId } = request.postDataJSON() as { userId: 1 | 2 };
      return route.fulfill({
        json: {
          ok: true,
          data: { token: String(userId), user: USERS[userId] },
        },
      });
    }

    // "Bearer 2" -> "2". Ukjent eller manglende token -> 401, som requireUser.
    const token = request.headers().authorization?.replace("Bearer ", "");
    const tasks = token ? TASKS_BY_TOKEN[token] : undefined;
    if (!token || !tasks) {
      return route.fulfill({
        status: 401,
        json: {
          ok: false,
          error: {
            code: "401",
            message: "Du må være innlogget",
            fieldErrors: {},
          },
        },
      });
    }

    if (path === "/api/v1/tasks") {
      calls.listTokens.push(token);
      return route.fulfill({ json: { ok: true, data: tasks } });
    }
    return route.fulfill({ status: 404, json: { ok: false } });
  });

  // Avatar-bildet: tomt svar, så ingenting går ut på nettet.
  await page.route("https://dummyjson.com/**", (route) =>
    route.fulfill({ status: 204 }),
  );

  return calls;
}

test("innloggingen lever til refresh, ikke ved navigasjon", async ({ page }) => {
  const calls = await mockApi(page);

  // 1. Oppstart: ingen er innlogget, så /login er den eneste skjermen.
  await page.goto("/");
  await expect(page.getByText("Hvem er du?")).toBeVisible();
  expect(calls.logins).toBe(0);

  // 2. Logg inn -> Hjem. Lista ble hentet MED tokenet fra innloggingen.
  await page.getByText("Ola Hansen (user)").click();
  await expect(page.getByText("Hei, Ola Hansen!")).toBeVisible();
  expect(calls.logins).toBe(1);
  expect(calls.listTokens).toEqual(["2"]);

  // 3. Naviger: Profil og Oppgaver bruker samme innlogging - ingen ny.
  await page.getByRole("tab", { name: /Profil/ }).click();
  await expect(page.getByText("Rolle: user")).toBeVisible();
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
  await expect(page.getByText("Olas oppgave")).toBeVisible();
  await page.getByRole("tab", { name: /Hjem/ }).click();
  await expect(page.getByText("Hei, Ola Hansen!")).toBeVisible();
  expect(calls.logins).toBe(1);

  // 4. Refresh: context er borte, tokenet også -> tilbake på /login.
  await page.reload();
  await expect(page.getByText("Hvem er du?")).toBeVisible();
  await page.getByText("Ola Hansen (user)").click();
  await expect(page.getByText("Hei, Ola Hansen!")).toBeVisible();
  expect(calls.logins).toBe(2);
});

test("uten innlogging sendes dyplenker til /login", async ({ page }) => {
  await mockApi(page);

  // Stack.Protected: /tasks finnes ikke før noen er innlogget.
  await page.goto("/tasks");
  await expect(page.getByText("Hvem er du?")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Oppgaver/ })).toHaveCount(0);
});

test("logg ut sender deg tilbake til /login", async ({ page }) => {
  await mockApi(page);

  await page.goto("/");
  await page.getByText("Ola Hansen (user)").click();
  await page.getByRole("tab", { name: /Profil/ }).click();
  await page.getByText("Logg ut").click();

  // user = null -> Stack.Protected bytter til /login selv.
  await expect(page.getByText("Hvem er du?")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Profil/ })).toHaveCount(0);
});

test("kontobytte henter ny liste - ikke forrige brukers fra cachen", async ({
  page,
}) => {
  const calls = await mockApi(page);

  // 1. Ola ser bare sin egen oppgave.
  await page.goto("/");
  await page.getByText("Ola Hansen (user)").click();
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
  await expect(page.getByText("Olas oppgave")).toBeVisible();
  await expect(page.getByText("Karis oppgave")).toHaveCount(0);

  // 2. Bytt til Kari (admin) på Profil -> ny henting med HENNES token.
  await page.getByRole("tab", { name: /Profil/ }).click();
  await page.getByText("Logg inn som Kari Nordmann (admin)").click();
  await expect(page.getByText("Rolle: admin")).toBeVisible();
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
  await expect(page.getByText("Karis oppgave")).toBeVisible();

  // 3. Tilbake til Ola: Karis oppgave er borte igjen. Lista ble hentet på
  //    nytt (cachen ble tømt), ikke tatt fra forrige gang Ola var innlogget.
  await page.getByRole("tab", { name: /Profil/ }).click();
  await page.getByText("Logg inn som Ola Hansen (user)").click();
  await expect(page.getByText("Rolle: user")).toBeVisible();
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
  await expect(page.getByText("Olas oppgave")).toBeVisible();
  await expect(page.getByText("Karis oppgave")).toHaveCount(0);
  expect(calls.listTokens).toEqual(["2", "1", "2"]);
});
