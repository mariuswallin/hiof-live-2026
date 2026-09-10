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
 * faktisk trenger: at avkryssingsboksen er skrudd på, noe TaskItem gjør
 * først etter hydrering.
 */
async function waitForHydration(page: Page) {
  await expect(taskItems(page).first().getByRole("checkbox")).toBeEnabled();
}

/**
 * Logger inn ved å trykke på knappen, som en bruker ville gjort. Knappen
 * setter cookien `demo-user` og laster siden på nytt.
 */
async function logInAsAdmin(page: Page) {
  await page.getByRole("button", { name: "Logg inn som admin" }).click();
  await expect(page.getByTestId("logged-in-as")).toHaveText(
    "Innlogget som admin@test.no"
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

  // Feilen kommer fra serveren, ikke fra klienten: sjekken ligger inne i
  // selve server-actionen.
  await expect(page.getByTestId("error").first()).toHaveText(
    "Du må være innlogget for å endre"
  );
});

test("server action lagrer avkryssingen i databasen", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/tasks");
  await waitForHydration(page);
  await logInAsAdmin(page);
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
