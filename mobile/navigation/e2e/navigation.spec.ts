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
const MOCK_TODO = { id: 3, todo: "Mocket todo fra testen", completed: false, userId: 68 };
const MOCK_USER = {
  id: 68,
  firstName: "Test",
  lastName: "Testesen",
  email: "test@example.com",
  image: "https://dummyjson.com/icon/test/128",
};

/**
 * page.route fanger ALLE forespørsler som matcher mønsteret, før de går ut
 * på nettet. route.fulfill svarer i stedet for serveren.
 */
async function mockApi(page: Page) {
  await page.route("https://dummyjson.com/**", (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/todos/3") return route.fulfill({ json: MOCK_TODO });
    if (path === "/users/68") return route.fulfill({ json: MOCK_USER });

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

test("viser feilmelding når API-et feiler", async ({ page }) => {
  // Denne gangen svarer "serveren" med 500.
  await page.route("https://dummyjson.com/**", (route) =>
    route.fulfill({ status: 500 }),
  );

  await page.goto("/tasks/3");

  await expect(page.getByText("Klarte ikke å hente")).toBeVisible();
  await expect(page.getByText("Kunne ikke hente /todos/3 (500)")).toBeVisible();
});
