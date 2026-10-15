// End to end-test for innlogging og tilgang. Kjør med:
//   npm run seed          (testene trenger brukerne og oppgavene fra seeden)
//   npm run test:e2e
//
// Enhetstestene sjekker funksjonene hver for seg. Her sjekker vi det bare en
// ekte nettleser kan vise: at cookien faktisk blir satt, at JavaScript ikke
// får lese den, og at vaktene og lista henger sammen.
//
// Fra seeden: Kari (id 1) er admin, Ola (id 2) er vanlig bruker.
import { test, expect, type Page } from "@playwright/test";
import { logInAs } from "./helpers";

/** Én oppgave i lista, funnet på tittelen. */
const taskItem = (page: Page, title: string) =>
  page.getByTestId("task-list").locator("li", { hasText: title });

test("/login viser brukerne fra databasen, med rolle", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByLabel("Bruker").locator("option")).toHaveText([
    "Kari Nordmann (admin)",
    "Ola Hansen (user)",
  ]);
});

test("innlogging setter en HttpOnly-cookie med bare id-en", async ({ page }) => {
  await logInAs(page, "bruker");

  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name === "session");

  // Verdien og attributtene serveren satte i Set-Cookie (session.ts). Rollen
  // står ikke i cookien: den ligger i databasen.
  expect(session).toMatchObject({
    value: "2",
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  });

  // HttpOnly: nettleseren SENDER cookien, men JavaScript på siden ser den ikke.
  expect(await page.evaluate(() => document.cookie)).not.toContain("session");
});

test("en cookie med en id som ikke finnes, gir ikke innlogging", async ({
  page,
  baseURL,
}) => {
  await page.context().addCookies([
    { name: "session", value: "999", url: baseURL },
  ]);

  await page.goto("/tasks");

  await expect(page).toHaveURL(/\/login$/);
});

test("/tasks sender uinnloggede til /login", async ({ page }) => {
  await page.goto("/tasks");

  // requireUserPage svarte 302, og nettleseren fulgte Location.
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Logg inn" })).toBeVisible();
});

test("uten innlogging svarer API-et 401", async ({ request }) => {
  // requireUser på ruta stopper forespørselen før controlleren kjører.
  const list = await request.get("/api/v1/tasks");
  expect(list.status()).toBe(401);
  expect(await list.json()).toMatchObject({
    ok: false,
    error: { code: "401" },
  });

  const create = await request.post("/api/v1/tasks", {
    data: { title: "Skal ikke lagres" },
  });
  expect(create.status()).toBe(401);
});

test("en vanlig bruker ser bare sine egne oppgaver", async ({ page }) => {
  await logInAs(page, "bruker");

  // Fra seeden: "Skrive obligen" er Ola sin, de to andre er Kari sine.
  await expect(taskItem(page, "Skrive obligen")).toBeVisible();
  await expect(taskItem(page, "Sette opp prosjektet")).toHaveCount(0);
});

test("admin ser oppgavene til alle, med eier på hver", async ({ page }) => {
  await logInAs(page, "admin");

  await expect(
    taskItem(page, "Skrive obligen").getByTestId("owner"),
  ).toHaveText("ola");
  await expect(
    taskItem(page, "Sette opp prosjektet").getByTestId("owner"),
  ).toHaveText("kari");
});

test("en ny oppgave lagres på den som er innlogget", async ({ page }) => {
  const title = `E2E ${Date.now()}`;

  // Ola lager oppgaven. `page.request` deler cookies med siden.
  await logInAs(page, "bruker");
  const created = await page.request.post("/api/v1/tasks", { data: { title } });
  expect(created.status()).toBe(201);
  const { data } = await created.json();
  expect(data.owner).toBe("ola");

  await page.reload();
  await expect(taskItem(page, title)).toBeVisible();

  // Admin ser den også, og at den er Ola sin.
  await logInAs(page, "admin");
  await expect(taskItem(page, title).getByTestId("owner")).toHaveText("ola");

  // Rydder opp, så testen kan kjøres om igjen mot samme database.
  const removed = await page.request.delete(`/api/v1/tasks/${data.id}`);
  expect(removed.status()).toBe(204);
});

test("vanlig bruker ser ingen slett-knapp, og API-et svarer 403 uansett", async ({
  page,
}) => {
  await logInAs(page, "bruker");

  // UI-et: useAuth() sier at vi ikke er admin, så TaskItem tegner ikke knappen.
  await expect(taskItem(page, "Skrive obligen")).toBeVisible();
  await expect(page.getByRole("button", { name: "Slett" })).toHaveCount(0);

  // Men en skjult knapp er ikke en vakt. Vi kaller ruta direkte, med samme
  // cookie som nettleseren har.
  const list = await page.request.get("/api/v1/tasks");
  const { data } = await list.json();

  const response = await page.request.delete(`/api/v1/tasks/${data[0].id}`);

  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({
    ok: false,
    error: { code: "403" },
  });

  // Serveren sa nei, så oppgaven finnes fortsatt.
  const after = await page.request.get(`/api/v1/tasks/${data[0].id}`);
  expect(after.status()).toBe(200);
});

test("admin ser slett-knappen", async ({ page }) => {
  await logInAs(page, "admin");

  await expect(
    page.getByRole("button", { name: "Slett" }).first(),
  ).toBeVisible();
});

test("logg ut sletter cookien, og /tasks er stengt igjen", async ({ page }) => {
  await logInAs(page, "bruker");

  await page.getByRole("button", { name: "Logg ut" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("logged-in-as")).toHaveText("Ikke innlogget");

  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "session")).toBeUndefined();

  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login$/);
});
