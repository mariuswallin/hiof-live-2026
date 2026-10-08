import { expect, test, type Page } from "@playwright/test";

/**
 * E2E: /admin er beskyttet med <Stack.Protected guard={isAdmin}>.
 *
 * - Vanlig bruker: ser ikke lenken, og /admin direkte -> sendes til "/".
 * - Admin: kan åpne /admin. Bytter hen til vanlig bruker MENS hen står der,
 *   blir guard false og hen sendes ut automatisk.
 */

/** Tom oppgaveliste og tomme bilder - ingenting går ut på nettet. */
async function mockApi(page: Page) {
  await page.route("https://dummyjson.com/**", (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/todos") return route.fulfill({ json: { todos: [] } });
    return route.fulfill({ status: 204 });
  });
}

test("vanlig bruker ser ikke admin og sendes bort fra /admin", async ({
  page,
}) => {
  await mockApi(page);

  // Standardkontoen er Ola (role: "user") - ingen admin-lenke på Hjem.
  await page.goto("/");
  await expect(page.getByText("Hei, Ola!")).toBeVisible();
  await expect(page.getByText("Åpne admin-panelet →")).toHaveCount(0);

  // Å skjule lenken er ikke nok - prøv URL-en direkte.
  await page.goto("/admin");
  await expect(page.getByText("Hei, Ola!")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Kun for admin")).toHaveCount(0);
});

test("admin kan åpne /admin og sendes ut når rollen forsvinner", async ({
  page,
}) => {
  await mockApi(page);

  // 1. Logg inn som admin fra Profil.
  await page.goto("/profile");
  await page.getByText("Logg inn som admin").click();
  await expect(page.getByText("Rolle: admin")).toBeVisible();

  // 2. Nå finnes lenken på Hjem, og /admin åpnes.
  await page.getByRole("tab", { name: /Hjem/ }).click();
  await page.getByText("Åpne admin-panelet →").click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Kun for admin")).toBeVisible();

  // 3. Bytt til vanlig bruker MENS vi står på /admin -> kastes ut.
  await page.getByText("Bytt til vanlig bruker").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Hei, Ola!")).toBeVisible();
  await expect(page.getByText("Kun for admin")).toHaveCount(0);
});
