// End to end-test for /tasks. Kjør med:
//   npm run test:e2e
//
// Testen dekker akkurat det som er vanskelig å teste på andre måter: at en
// server-komponent henter fra databasen, og at en server action skriver TIL
// den. Det siste er poenget med `page.reload()` nederst: en knapp som bare
// endrer React-state ser helt lik ut i nettleseren, men overlever ikke en
// omlasting.
import { test, expect, type Page } from "@playwright/test";

const taskItems = (page: Page) => page.getByTestId("task");

/**
 * Venter på at klient-koden har tatt over.
 *
 * Ikke `waitForLoadState("networkidle")`. Den venter på at nettverket blir
 * stille, som er noe annet enn at siden er klar, og i dev-modus blir det
 * aldri helt stille (HMR holder en socket åpen). Her venter vi på det vi
 * faktisk trenger: `<html data-hydrated="true">`, som client.tsx setter når
 * React har hydrert siden.
 */
async function waitForHydration(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

/**
 * Bytter bruker via DemoUserPanel nede i høyre hjørne, som en bruker ville
 * gjort. Knappen setter cookien `demo-user` og henter siden på nytt.
 */
async function logInAs(page: Page, name: "Admin" | "Bruker") {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByTestId("logged-in-as")).toHaveText(
    name === "Admin"
      ? "Innlogget som admin@test.no"
      : "Innlogget som test@example.com"
  );
}

test("server-komponenten viser oppgavene fra databasen", async ({ page }) => {
  await page.goto("/tasks");

  await expect(page.getByRole("heading", { name: "Oppgaver" })).toBeVisible();

  // Kommer fra seeden. Kjør `npm run seed` hvis denne feiler.
  await expect(taskItems(page).first()).toBeVisible();
  await expect(page.getByText("Lese leksjonen før timen")).toBeVisible();
});

test("uten innlogging avviser server action endringen", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/tasks");
  await waitForHydration(page);

  await expect(page.getByTestId("logged-in-as")).toHaveText("Ikke innlogget");

  // `click()`, ikke `check()`. `check()` krever at boksen endrer seg med én
  // gang, men vår er kontrollert av React og oppdateres først når serveren
  // har svart. Da feiler `check()` selv om alt virker som det skal.
  await taskItems(page).first().getByRole("checkbox").click();

  // Feilen kommer fra serveren, ikke fra klienten: server actionen går ikke
  // gjennom mellomvaren, men servicen sier nei likevel.
  await expect(page.getByTestId("error").first()).toHaveText(
    "Du må være innlogget"
  );
});

test("server action lagrer avkryssingen i databasen", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/tasks");
  await waitForHydration(page);
  await logInAs(page, "Admin");
  await waitForHydration(page);

  const firstTask = taskItems(page).first();
  const checkbox = firstTask.getByRole("checkbox");

  // Vi vet ikke om første oppgave starter som ferdig eller ikke, så vi leser
  // tilstanden og snur den. Da virker testen uansett hva seeden inneholder.
  const wasCompleted = await checkbox.isChecked();
  await checkbox.click();

  await expect(firstTask.getByTestId("status")).toHaveText(
    wasCompleted ? "ikke ferdig" : "ferdig"
  );

  // Selve poenget: last siden på nytt, og se at serveren fortsatt mener det
  // samme. Da vet vi at skrivingen faktisk traff databasen.
  await page.reload();
  await waitForHydration(page);
  await expect(taskItems(page).first().getByRole("checkbox")).toBeChecked({
    checked: !wasCompleted,
  });

  // Rydder opp, så testen kan kjøres om igjen mot samme database.
  await taskItems(page).first().getByRole("checkbox").click();
  await expect(taskItems(page).first().getByTestId("status")).toHaveText(
    wasCompleted ? "ferdig" : "ikke ferdig"
  );
});

test("server action lager en oppgave", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/tasks");
  await waitForHydration(page);
  await logInAs(page, "Admin");

  const title = `E2E ${Date.now()}`;
  await page.getByLabel("Ny oppgave").fill(title);
  await page.getByRole("button", { name: "Legg til" }).click();

  const created = taskItems(page).filter({ hasText: title });
  await expect(created).toHaveCount(1);
  await expect(page.getByLabel("Ny oppgave")).toHaveValue("");

  // Overlever omlasting: den ligger i databasen.
  await page.reload();
  await expect(created).toHaveCount(1);

  // Rydd opp via API-et.
  await created.getByRole("button", { name: "Slett" }).click();
  await expect(created).toHaveCount(0);
});

test("tom tittel gir valideringsfeil fra servicen", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/tasks");
  await waitForHydration(page);
  await logInAs(page, "Admin");

  await page.getByRole("button", { name: "Legg til" }).click();

  await expect(page.getByText("Tittel kan ikke være tom")).toBeVisible();
});

test("vanlig bruker får 403 ved sletting, og oppgaven kommer tilbake", async ({
  page,
}) => {
  await page.context().clearCookies();
  await page.goto("/tasks");
  await waitForHydration(page);
  await logInAs(page, "Bruker");

  const count = await taskItems(page).count();
  await taskItems(page).first().getByRole("button", { name: "Slett" }).click();

  await expect(page.getByTestId("delete-error")).toContainText("FORBIDDEN");
  // useOptimistic ruller tilbake av seg selv.
  await expect(taskItems(page)).toHaveCount(count);
});

test("admin sletter via DELETE /api/tasks/:id", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/tasks");
  await waitForHydration(page);
  await logInAs(page, "Admin");

  const title = `Slett ${Date.now()}`;
  await page.getByLabel("Ny oppgave").fill(title);
  await page.getByRole("button", { name: "Legg til" }).click();
  const created = taskItems(page).filter({ hasText: title });
  await expect(created.getByRole("checkbox")).toBeEnabled();

  const deleteRequest = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().includes("/api/tasks/")
  );
  await created.getByRole("button", { name: "Slett" }).click();
  expect((await deleteRequest).status()).toBe(204);

  await expect(created).toHaveCount(0);
  await page.reload();
  await expect(created).toHaveCount(0);
});
