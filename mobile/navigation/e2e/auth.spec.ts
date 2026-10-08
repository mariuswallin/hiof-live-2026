import { expect, test } from "@playwright/test";

/**
 * E2E: hvor lenge "lever" brukeren i AuthContext?
 *
 * fetchCurrentUser() logger "[auth] Henter innlogget bruker" hver gang den
 * kalles. Vi teller loggene:
 *
 *   oppstart          -> 1 henting
 *   navigere rundt    -> fortsatt 1 (provideren ligger over navigatoren)
 *   refresh (reload)  -> 2 (JS-minnet er tømt, brukeren må hentes på nytt)
 */
test("henter brukeren ved oppstart og refresh, ikke ved navigasjon", async ({
  page,
}) => {
  // Oppgavelista (TasksContext) får en tom liste, avatar-bildet et tomt svar.
  // Da går ingenting ut på nettet.
  await page.route("https://dummyjson.com/**", (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/todos") return route.fulfill({ json: { todos: [] } });
    return route.fulfill({ status: 204 });
  });

  let fetches = 0;
  page.on("console", (message) => {
    if (message.text().includes("[auth] Henter innlogget bruker")) fetches++;
  });

  // 1. Oppstart: Hjem viser brukeren når API-svaret har kommet.
  await page.goto("/");
  await expect(page.getByText("Hei, Ola!")).toBeVisible();
  expect(fetches).toBe(1);

  // 2. Naviger: Profil og Oppgaver bruker samme bruker - ingen ny henting.
  await page.getByRole("tab", { name: /Profil/ }).click();
  await expect(page.getByText("Ola Nordmann")).toBeVisible();
  await page.getByRole("tab", { name: /Oppgaver/ }).click();
  await page.getByRole("tab", { name: /Hjem/ }).click();
  await expect(page.getByText("Hei, Ola!")).toBeVisible();
  expect(fetches).toBe(1);

  // 3. Refresh: context er borte, AuthProvider henter brukeren på nytt.
  await page.reload();
  await expect(page.getByText("Hei, Ola!")).toBeVisible();
  expect(fetches).toBe(2);
});
