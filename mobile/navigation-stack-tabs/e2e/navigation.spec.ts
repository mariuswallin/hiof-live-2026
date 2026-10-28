import { expect, test, type Page } from "@playwright/test";

/**
 * E2E: en hel navigasjonsflyt, slik en bruker ville gjort det.
 *
 *   /login -> Hjem -> Oppgaver-taben -> detaljside (/tasks/3) -> tilbake
 *
 * API-ene MOCKES - både webappen vår (innlogging og oppgaver) og
 * dummyjson.com (brukere). Da er testen:
 * - rask og stabil (ikke avhengig av nettet eller at webappen kjører)
 * - forutsigbar (vi bestemmer selv hva API-et svarer)
 *
 * NB: tokenet ligger bare i minnet. page.goto() laster siden på nytt, og da
 * er du logget ut. Etter innloggingen navigerer testene derfor med klikk.
 */

/** Falske svar - samme form som API-ene, så zod-valideringen går gjennom. */

/** Adressen api/tasks.ts og api/auth.ts bruker. */
const TASKS_API = "http://localhost:5173/api/v1";

/** Brukeren webappen svarer med på POST /api/v1/login. Token = id-en. */
const OLA = { id: 2, name: "Ola Hansen", email: "ola@example.com", role: "user" };

/** Lista TasksContext henter etter innloggingen (GET /api/v1/tasks). */
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

/** Som requireUser i webappen: uten riktig token -> 401. */
const UNAUTHORIZED = {
  status: 401,
  json: {
    ok: false,
    error: { code: "401", message: "Du må være innlogget", fieldErrors: {} },
  },
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

    // Innloggingen: som apiLogin i auth-routes.ts.
    if (path === "/api/v1/login") {
      return route.fulfill({
        json: { ok: true, data: { token: "2", user: OLA } },
      });
    }

    // Alle /tasks-ruter krever tokenet. Glemmer appen det, svarer vi som
    // webappen - og testen feiler.
    if (request.headers().authorization !== "Bearer 2") {
      return route.fulfill(UNAUTHORIZED);
    }

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

/** Åpne appen og logg inn som Ola. Ender på Hjem. */
async function login(page: Page) {
  await page.goto("/");
  await page.getByText("Ola Hansen (user)").click();
  await expect(page.getByText("Hei, Ola Hansen!")).toBeVisible();
}

test("navigerer fra lista til detaljsiden og tilbake", async ({ page }) => {
  await mockApi(page);

  // 1. Logg inn (havner på Hjem, "/") og bytt til Oppgaver-taben.
  await login(page);
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

test("ny oppgave legges oppå tabs og går tilbake etter lagring", async ({
  page,
}) => {
  await mockApi(page);

  // 1. Fra lista: + i headeren åpner skjemaet.
  await login(page);
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
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
  const request = await postRequest;
  expect(request.postDataJSON()).toEqual({
    title: "Lære Stack",
    completed: false,
  });
  // Tokenet fra innloggingen - det er slik webappen vet hvem som eier oppgaven.
  expect(request.headers().authorization).toBe("Bearer 2");

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

  // "Ny oppgave"-knappen på Hjem (router.push).
  await login(page);
  await page.getByText("Ny oppgave", { exact: true }).click();
  await expect(page).toHaveURL(/\/new-task$/);

  // Appen sjekker bare "minst 3 tegn" - maks 200 er det webappen som passer på.
  await page.getByPlaceholder("Enter task name").fill("x".repeat(201));
  await page.getByText("Register Task").click();

  // Ingen router.back(): vi står fortsatt på skjemaet, med serverens feil.
  await expect(page.getByText("Tittel kan være maks 200 tegn")).toBeVisible();
  await expect(page).toHaveURL(/\/new-task$/);
});

test("dynamisk rute utenfor tabs kan åpnes direkte", async ({ page }) => {
  await mockApi(page);

  // 1. Rett på /users/68 med lenken på Hjem - uten å gå via lista.
  await login(page);
  await page.getByText("Åpne bruker 68 direkte →").click();
  await expect(page).toHaveURL(/\/users\/68$/);
  await expect(page.getByText("Neste bruker (69) →")).toBeVisible();
  // users/ ligger i rot-Stacken, UTENFOR tabs -> ingen tab-bar.
  await expect(page.getByRole("tab", { name: /Hjem/ })).toHaveCount(0);

  // 2. Samme fil, ny parameter: push legger bruker 69 oppå.
  await page.getByText("Neste bruker (69) →").click();
  await expect(page).toHaveURL(/\/users\/69$/);
  await expect(page.getByText("Neste bruker (70) →")).toBeVisible();

  // 3. Tilbake-knappen i headeren (på web en lenke med forrige tittel).
  await page.getByRole("link", { name: "Test Testesen, back" }).click();
  await expect(page).toHaveURL(/\/users\/68$/);

  // 4. Tilbake til Hjem, og inn via lista denne gangen.
  //    NB: en EKTE dyplenke (adressefeltet) kan ikke testes her lenger -
  //    page.goto laster siden på nytt, og da er tokenet borte.
  await page.goBack();
  await expect(page.getByText("Hei, Ola Hansen!")).toBeVisible();
  await page.getByText("Brukere (utenfor tabs) →").click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByText("Neste Nordmann")).toBeVisible();
  await page.getByText("Test Testesen").click();
  await expect(page).toHaveURL(/\/users\/68$/);
});

test("viser feilmelding når API-et feiler", async ({ page }) => {
  // Lista går bra, men enkelt-oppgaven (use() i [id].tsx) svarer 500.
  // Feilen havner i ErrorBoundary-eksporten i [id].tsx.
  await mockApi(page);
  await page.route(`${TASKS_API}/tasks/3`, (route) =>
    route.fulfill({ status: 500, json: { ok: false } }),
  );

  await login(page);
  await page.getByText("Åpne oppgave 3 direkte →").click();
  await expect(page).toHaveURL(/\/tasks\/3$/);

  // exact: i dev viser LogBox også feilen i en toast nederst - den har mer
  // tekst rundt, så exact treffer bare meldingen i ErrorBoundary.
  await expect(page.getByText("Klarte ikke å hente")).toBeVisible();
  await expect(
    page.getByText("Kunne ikke hente oppgave 3 (500)", { exact: true }),
  ).toBeVisible();
});

test("viser feilmelding når lista ikke kan hentes", async ({ page }) => {
  // Innloggingen går bra, men webappen svarer 500 på GET /api/v1/tasks i
  // TasksContext. use() kaster, og feilen havner i ErrorBoundary-eksporten i
  // rot-_layout.tsx.
  await mockApi(page);
  await page.route(`${TASKS_API}/tasks`, (route) =>
    route.fulfill({ status: 500, json: { ok: false } }),
  );

  await page.goto("/");
  await page.getByText("Ola Hansen (user)").click();

  await expect(page.getByText("Noe gikk galt")).toBeVisible();
  await expect(
    page.getByText("Kunne ikke hente oppgaver (500)", { exact: true }),
  ).toBeVisible();
});
