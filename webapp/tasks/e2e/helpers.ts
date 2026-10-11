// Delt av e2e-testene. Fila heter ikke *.e2e.ts, så Playwright kjører den ikke
// som en test (se testMatch i playwright.config.ts).
import { expect, type Page } from "@playwright/test";

/**
 * Venter på at klient-koden har tatt over.
 *
 * Ikke `waitForLoadState("networkidle")`. Den venter på at nettverket blir
 * stille, som er noe annet enn at siden er klar, og i dev-modus blir det
 * aldri helt stille (HMR holder en socket åpen). Her venter vi på det vi
 * faktisk trenger: `<html data-hydrated="true">`, som client.tsx setter når
 * React har hydrert siden.
 */
export async function waitForHydration(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

/**
 * Logger inn via skjemaet på /login, som en bruker ville gjort. Serveren
 * svarer med Set-Cookie og en redirect, så vi ender på /tasks.
 *
 * Playwright tar vare på cookien i nettleser-konteksten, akkurat som en ekte
 * nettleser. Hver test får en ny kontekst, og starter derfor uinnlogget.
 */
export async function logInAs(
  page: Page,
  role: "Admin" | "Bruker",
  user: "Kari Nordmann" | "Ola Hansen" = "Kari Nordmann",
) {
  await page.goto("/login");
  await waitForHydration(page);

  await page.getByLabel(user).check();
  if (role === "Admin") await page.getByLabel("Logg inn som admin").check();
  await page.getByRole("button", { name: "Logg inn" }).click();

  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByTestId("logged-in-as")).toHaveText(
    `${user} (${role === "Admin" ? "admin" : "user"})`,
  );
  await waitForHydration(page);
}
