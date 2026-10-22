import { expect, test, type Page } from "@playwright/test";

/**
 * E2E: en hel navigasjonsflyt, slik en bruker ville gjort det.
 *
 *   Hjem -> Oppgaver-taben -> detaljside (/tasks/3) -> tilbake til lista
 *
 * API-ene MOCKES - både webappen vår (oppgaver) og dummyjson.com (brukere).
 * Da er testen:
 * - rask og stabil (ikke avhengig av nettet eller at webappen kjører)
 * - forutsigbar (vi bestemmer selv hva API-et svarer)
 */

/** Falske svar - samme form som API-ene, så zod-valideringen går gjennom. */

/** Adressen api/tasks.ts bruker. */
const TASKS_API = "http://localhost:5173/api/v1";

/** Lista TasksContext henter ved oppstart (GET /api/v1/tasks). */
const MOCK_TASKS = [
  { id: "1", title: "Lese om props", completed: true },
  { id: "3", title: "Prøve FlatList", completed: false },
];
/** Detaljsiden henter én (GET /api/v1/tasks/3). */
const MOCK_TASK = { id: "3", title: "Mocket oppgave fra testen", completed: false };
const MOCK_USER = {
  id: 68,
  firstName: "Test",
  lastName: "Testesen",
  email: "test@example.com",
  image: "https://dummyjson.com/icon/test/128",
};
const MOCK_NEXT_USER = {
  id: 69,
  firstName: "Neste",
  lastName: "Nordmann",
  email: "neste@example.com",
  image: "https://dummyjson.com/icon/neste/128",
};

/**
 * page.route fanger ALLE forespørsler som matcher mønsteret, før de går ut
 * på nettet. route.fulfill svarer i stedet for serveren.
 */
async function mockApi(page: Page) {
  // Webappen: { ok, data } rundt alt, som task-controller.ts svarer.
  await page.route(`${TASKS_API}/**`, (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/tasks" && request.method() === "POST") {
      // Svar som webappen: 201 + oppgaven, med en id SERVEREN har laget.
      const body = request.postDataJSON();
      return route.fulfill({
        status: 201,
        json: { ok: true, data: { id: "99", ...body } },
      });
    }
    if (path === "/api/v1/tasks") {
      return route.fulfill({ json: { ok: true, data: MOCK_TASKS } });
    }
    if (path === "/api/v1/tasks/3") {
      return route.fulfill({ json: { ok: true, data: MOCK_TASK } });
    }
    return route.fulfill({ status: 404, json: { ok: false } });
  });

  await page.route("https://dummyjson.com/**", (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/users/68") return route.fulfill({ json: MOCK_USER });
    if (path === "/users/69") return route.fulfill({ json: MOCK_NEXT_USER });
    // GET /users?limit=10&select=... - pathname er bare "/users".
    if (path === "/users") {
      return route.fulfill({ json: { users: [MOCK_USER, MOCK_NEXT_USER] } });
    }

    // Bilder o.l.: svar med tomt innhold, så ingenting går ut på nettet.
    return route.fulfill({ status: 204 });
  });
}

test("navigerer fra lista til detaljsiden og tilbake", async ({ page }) => {
  await mockApi(page);

  // 1. Start på Hjem ("/") og bytt til Oppgaver-taben.
  await page.goto("/");
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
  await expect(page).toHaveURL(/\/tasks$/);

  // 2. Trykk på en oppgave -> detaljsiden, med id-en i URL-en.
  await page.getByText("Prøve FlatList").click();
  await expect(page).toHaveURL(/\/tasks\/3$/);

  // 3. Detaljsiden viser MOCK-dataene (hentet med use() + Suspense).
  await expect(page.getByText("«Mocket oppgave fra testen»")).toBeVisible();

  // 4. Tilbake (samme som tilbake-knappen i headeren).
  await page.goBack();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText("Prøve FlatList")).toBeVisible();
});

test("eier-skjermen henter brukeren fra dummyjson", async ({ page }) => {
  await mockApi(page);

  // Ingen lenke hit fra detaljsiden ennå - webappen sender ikke userId.
  // Men ruten virker: åpne den direkte, så henter getUser() bruker 68.
  await page.goto("/tasks/user/68");
  await expect(page.getByText("test@example.com")).toBeVisible();
  await expect(page.getByText("userId: 68")).toBeVisible();
});

test("ny oppgave legges oppå tabs og går tilbake etter lagring", async ({
  page,
}) => {
  await mockApi(page);

  // 1. Fra lista: + i headeren åpner skjemaet.
  await page.goto("/tasks");
  await page.getByLabel("Ny oppgave").click();
  await expect(page).toHaveURL(/\/new-task$/);

  // 2. Skjemaet ligger i rot-Stacken, UTENFOR tabs -> ingen tab-bar.
  await expect(page.getByRole("tab", { name: /Hjem/ })).toHaveCount(0);

  // 3. Lagre -> addApi() sender POST til webappen. Vi fanger forespørselen
  //    for å se HVA appen sendte.
  await page.getByPlaceholder("Enter task name").fill("Lære Stack");
  const postRequest = page.waitForRequest(
    (request) =>
      request.url() === `${TASKS_API}/tasks` && request.method() === "POST",
  );
  await page.getByText("Register Task").click();
  expect((await postRequest).postDataJSON()).toEqual({
    title: "Lære Stack",
    completed: false,
  });

  // 4. 201 -> router.back() -> tilbake på lista, med oppgaven fra svaret.
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText("Lære Stack")).toBeVisible();
});

test("ny oppgave blir stående med feilen når webappen svarer 400", async ({
  page,
}) => {
  await mockApi(page);
  // Registreres ETTER mockApi, og vinner derfor for POST: siste route først.
  await page.route(`${TASKS_API}/tasks`, (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({
      status: 400,
      json: {
        ok: false,
        error: {
          code: "400",
          message: "Ikke gyldig data",
          fieldErrors: { title: ["Tittel kan være maks 200 tegn"] },
        },
      },
    });
  });

  // Appen sjekker bare "minst 3 tegn" - maks 200 er det webappen som passer på.
  await page.goto("/new-task");
  await page.getByPlaceholder("Enter task name").fill("x".repeat(201));
  await page.getByText("Register Task").click();

  // Ingen router.back(): vi står fortsatt på skjemaet, med serverens feil.
  await expect(page.getByText("Tittel kan være maks 200 tegn")).toBeVisible();
  await expect(page).toHaveURL(/\/new-task$/);
});

test("dynamisk rute utenfor tabs kan åpnes direkte", async ({ page }) => {
  await mockApi(page);

  // 1. Rett på /users/68 - uten å gå via noen tab.
  //    (Lista ligger allerede under i DOM-en, så vi sjekker tekst som bare
  //    finnes på brukersiden.)
  await page.goto("/users/68");
  await expect(page.getByText("Neste bruker (69) →")).toBeVisible();
  // users/ ligger i rot-Stacken, UTENFOR tabs -> ingen tab-bar.
  await expect(page.getByRole("tab", { name: /Hjem/ })).toHaveCount(0);

  // 2. Samme fil, ny parameter: push legger bruker 69 oppå.
  await page.getByText("Neste bruker (69) →").click();
  await expect(page).toHaveURL(/\/users\/69$/);
  await expect(page.getByText("Neste bruker (70) →")).toBeVisible();

  // 3. Tilbake-knappen i headeren (på web en lenke med forrige tittel):
  //    først til 68, så til lista - som initialRouteName i
  //    users/_layout.tsx la under, selv om vi aldri åpnet den.
  await page.getByRole("link", { name: "Test Testesen, back" }).click();
  await expect(page).toHaveURL(/\/users\/68$/);
  await page.getByRole("link", { name: "Brukere, back" }).click();
  // Lista som initialRouteName la under, arver parameterne fra lenken:
  // /users?userId=68. Ufarlig - lista bryr seg ikke om userId.
  await expect(page).toHaveURL(/\/users(\?userId=68)?$/);
  await expect(page.getByText("Neste Nordmann")).toBeVisible();

  // 4. Fra lista inn på en bruker igjen.
  await page.getByText("Test Testesen").click();
  await expect(page).toHaveURL(/\/users\/68$/);
});

test("viser feilmelding når API-et feiler", async ({ page }) => {
  // Lista går bra, men enkelt-oppgaven (use() i [id].tsx) svarer 500.
  // Feilen havner i ErrorBoundary-eksporten i [id].tsx.
  await page.route(`${TASKS_API}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/api/v1/tasks") {
      return route.fulfill({ json: { ok: true, data: MOCK_TASKS } });
    }
    return route.fulfill({ status: 500, json: { ok: false } });
  });
  await page.route("https://dummyjson.com/**", (route) =>
    route.fulfill({ status: 204 }),
  );

  await page.goto("/tasks/3");

  // exact: i dev viser LogBox også feilen i en toast nederst - den har mer
  // tekst rundt, så exact treffer bare meldingen i ErrorBoundary.
  await expect(page.getByText("Klarte ikke å hente")).toBeVisible();
  await expect(
    page.getByText("Kunne ikke hente oppgave 3 (500)", { exact: true }),
  ).toBeVisible();
});

test("viser feilmelding når lista ikke kan hentes", async ({ page }) => {
  // Webappen svarer 500 på GET /api/v1/tasks i TasksContext. use() kaster,
  // og feilen havner i ErrorBoundary-eksporten i rot-_layout.tsx.
  await page.route(`${TASKS_API}/**`, (route) =>
    route.fulfill({ status: 500, json: { ok: false } }),
  );
  await page.route("https://dummyjson.com/**", (route) =>
    route.fulfill({ status: 204 }),
  );

  await page.goto("/tasks");

  await expect(page.getByText("Noe gikk galt")).toBeVisible();
  await expect(
    page.getByText("Kunne ikke hente oppgaver (500)", { exact: true }),
  ).toBeVisible();
});
