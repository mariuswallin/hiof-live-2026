// Delt av e2e-testene. Fila heter ikke *.e2e.ts, så Playwright kjører den ikke
// som en test (se testMatch i playwright.config.ts).
import { expect, type Page } from "@playwright/test";

/** Brukerne fra seeden, slik de står i nedtrekkslista på /login. */
const USERS = {
  admin: "Kari Nordmann (admin)",
  bruker: "Ola Hansen (user)",
} as const;

/**
 * Logger inn via skjemaet på /login, som en bruker ville gjort. Serveren
 * svarer med Set-Cookie og en redirect, så vi ender på /tasks.
 *
 * Skjemaet er vanlig HTML uten JavaScript, så vi trenger ikke vente på at
 * React har tatt over siden før vi sender det.
 *
 * Playwright tar vare på cookien i nettleser-konteksten, akkurat som en ekte
 * nettleser. Hver test får en ny kontekst, og starter derfor uinnlogget.
 */
export async function logInAs(page: Page, who: keyof typeof USERS) {
  await page.goto("/login");

  await page.getByLabel("Bruker").selectOption({ label: USERS[who] });
  await page.getByRole("button", { name: "Logg inn" }).click();

  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByTestId("logged-in-as")).toHaveText(USERS[who]);
}
