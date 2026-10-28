import { expect, test, type Page } from "@playwright/test";

/**
 * E2E: /admin er beskyttet med <Stack.Protected guard={isAdmin}>.
 *
 * - Vanlig bruker: ser ikke lenken, og /admin finnes ikke.
 * - Admin: kan åpne /admin. Bytter hen til vanlig bruker MENS hen står der,
 *   blir guard false og hen sendes ut automatisk.
 *
 * Rollen kommer fra webappen (POST /api/v1/login), ikke fra appen.
 */

const API = "http://localhost:5173/api/v1";

/** Brukerne i webappens seed. Token = id-en, som i webappen. */
const USERS = {
  1: { id: 1, name: "Kari Nordmann", email: "kari@example.com", role: "admin" },
  2: { id: 2, name: "Ola Hansen", email: "ola@example.com", role: "user" },
} as const;

/** Innlogging, tom oppgaveliste og tomme bilder - ingenting går ut på nettet. */
async function mockApi(page: Page) {
  await page.route(`${API}/login`, (route) => {
    const { userId } = route.request().postDataJSON() as { userId: 1 | 2 };
    return route.fulfill({
      json: { ok: true, data: { token: String(userId), user: USERS[userId] } },
    });
  });
  await page.route(`${API}/tasks`, (route) => {
    // Uten token svarer webappen 401 - da hadde lista feilet.
    if (!route.request().headers().authorization?.startsWith("Bearer ")) {
      return route.fulfill({ status: 401, json: { ok: false } });
    }
    return route.fulfill({ json: { ok: true, data: [] } });
  });
  await page.route("https://dummyjson.com/**", (route) =>
    route.fulfill({ status: 204 }),
  );
}

test("vanlig bruker ser ikke admin, og /admin sender til /login", async ({
  page,
}) => {
  await mockApi(page);

  // Å skjule lenken er ikke nok - prøv URL-en direkte. Uten innlogging finnes
  // bare /login.
  await page.goto("/admin");
  await expect(page.getByText("Hvem er du?")).toBeVisible();
  await expect(page.getByText("Kun for admin")).toHaveCount(0);

  // Ola (role: "user" fra webappen) - ingen admin-lenke på Hjem, og /admin
  // er ikke åpnet.
  await page.getByText("Ola Hansen (user)").click();
  await expect(page.getByText("Hei, Ola Hansen!")).toBeVisible();
  await expect(page.getByText("Åpne admin-panelet →")).toHaveCount(0);
  await expect(page.getByText("Kun for admin")).toHaveCount(0);
});

test("admin kan åpne /admin og sendes ut når rollen forsvinner", async ({
  page,
}) => {
  await mockApi(page);

  // 1. Logg inn som Ola, og bytt til Kari (admin) fra Profil.
  await page.goto("/");
  await page.getByText("Ola Hansen (user)").click();
  await page.getByRole("tab", { name: /Profil/ }).click();
  await page.getByText("Logg inn som Kari Nordmann (admin)").click();
  await expect(page.getByText("Rolle: admin")).toBeVisible();

  // 2. Nå finnes lenken på Hjem, og /admin åpnes.
  await page.getByRole("tab", { name: /Hjem/ }).click();
  await page.getByText("Åpne admin-panelet →").click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Kun for admin")).toBeVisible();

  // 3. Bytt til vanlig bruker MENS vi står på /admin -> kastes ut.
  await page.getByText("Bytt til vanlig bruker").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Hei, Ola Hansen!")).toBeVisible();
  await expect(page.getByText("Kun for admin")).toHaveCount(0);
});
