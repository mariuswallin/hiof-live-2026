import { expect, test, type Page } from "@playwright/test";

/**
 * E2E: en hel navigasjonsflyt, slik en bruker ville gjort det.
 *
 *   Hjem -> Oppgaver-taben -> detaljside (/tasks/3) -> eier (/tasks/user/68)
 *        -> tilbake -> tilbake til lista
 *
 * API-et (dummyjson.com) MOCKES. Da er testen:
 * - rask og stabil (ikke avhengig av nettet eller at API-et er oppe)
 * - forutsigbar (vi bestemmer selv hva API-et svarer)
 */

/** Falske svar - samme form som dummyjson, så zod-valideringen går gjennom. */

/** Lista TasksContext henter ved oppstart (GET /todos?limit=8). */
const MOCK_TODOS = [
  { id: 1, todo: "Lese om props", completed: true, userId: 1 },
  { id: 3, todo: "Prøve FlatList", completed: false, userId: 68 },
];
const MOCK_TODO = { id: 3, todo: "Mocket todo fra testen", completed: false, userId: 68 };
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
  await page.route("https://dummyjson.com/**", (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/todos") return route.fulfill({ json: { todos: MOCK_TODOS } });
    if (path === "/todos/3") return route.fulfill({ json: MOCK_TODO });
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

test("navigerer fra lista til detalj og videre til eier", async ({ page }) => {
  await mockApi(page);

  // 1. Start på Hjem ("/") og bytt til Oppgaver-taben.
  await page.goto("/");
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
  await expect(page).toHaveURL(/\/tasks$/);

  // 2. Trykk på en oppgave -> detaljsiden, med id-en i URL-en.
  await page.getByText("Prøve FlatList").click();
  await expect(page).toHaveURL(/\/tasks\/3$/);

  // 3. Detaljsiden viser MOCK-dataene (hentet med useEffect).
  await expect(page.getByText("«Mocket todo fra testen»")).toBeVisible();

  // 4. Videre til eieren -> userId fra API-svaret havner i URL-en.
  await page.getByText("Se hvem som eier den →").click();
  await expect(page).toHaveURL(/\/tasks\/user\/68$/);
  await expect(page.getByText("test@example.com")).toBeVisible();

  // 5. Tilbake (samme som tilbake-knappen i headeren) - to ganger.
  await page.goBack();
  await expect(page).toHaveURL(/\/tasks\/3$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText("Prøve FlatList")).toBeVisible();
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

  // 3. Lagre -> router.back() -> tilbake på lista, med den nye oppgaven.
  await page.getByPlaceholder("Enter task name").fill("Lære Stack");
  await page.getByText("Register Task").click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText("Lære Stack")).toBeVisible();
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
  // Lista går bra, men enkelt-oppgaven (useEffect i [id].tsx) svarer 500.
  await page.route("https://dummyjson.com/**", (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/todos") return route.fulfill({ json: { todos: MOCK_TODOS } });
    return route.fulfill({ status: 500 });
  });

  await page.goto("/tasks/3");

  await expect(page.getByText("Klarte ikke å hente")).toBeVisible();
  await expect(page.getByText("Kunne ikke hente /todos/3 (500)")).toBeVisible();
});

test("viser feilmelding når lista ikke kan hentes", async ({ page }) => {
  // Alt svarer 500 - også GET /todos i TasksContext.
  await page.route("https://dummyjson.com/**", (route) =>
    route.fulfill({ status: 500 }),
  );

  await page.goto("/tasks");

  await expect(page.getByText("Klarte ikke å hente oppgaver")).toBeVisible();
  await expect(page.getByText("Kunne ikke hente oppgaver (500)")).toBeVisible();
});
