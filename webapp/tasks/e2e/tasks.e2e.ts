// End to end-test for /tasks. Kjør med:
//   npm run test:e2e
//
// Testen dekker akkurat det som er vanskelig å teste på andre måter: at en
// server-komponent henter fra databasen, og at en server action skriver TIL
// den. Det siste er poenget med `page.reload()` nederst: en knapp som bare
// endrer React-state ser helt lik ut i nettleseren, men overlever ikke en
// omlasting.
import { test, expect, type Page } from "@playwright/test";
import { logInAs, waitForHydration } from "./helpers";

const taskItems = (page: Page) => page.getByTestId("task");

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
  await logInAs(page, "Admin");

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
  await logInAs(page, "Admin");

  await page.getByRole("button", { name: "Legg til" }).click();

  await expect(page.getByText("Tittel kan ikke være tom")).toBeVisible();
});

test("frist i fortiden avvises, frist fram i tid lagres", async ({ page }) => {
  await logInAs(page, "Admin");

  const title = `E2E frist ${Date.now()}`;
  const dueDate = page.getByLabel("Frist (valgfri)");

  // Regelen står i validateTask. Skjemaet vet ingenting om den.
  await page.getByLabel("Ny oppgave").fill(title);
  await dueDate.fill("2000-01-01");
  await page.getByRole("button", { name: "Legg til" }).click();

  await expect(page.getByText("Fristen kan ikke være før i dag")).toBeVisible();
  // Det brukeren skrev, kommer tilbake fra serveren via `values`.
  await expect(dueDate).toHaveValue("2000-01-01");
  await expect(page.getByLabel("Ny oppgave")).toHaveValue(title);

  await dueDate.fill("2099-12-31");
  await page.getByRole("button", { name: "Legg til" }).click();

  const created = taskItems(page).filter({ hasText: title });
  await expect(created.getByTestId("due-date")).toHaveText("frist 2099-12-31");

  // Rydd opp.
  await created.getByRole("button", { name: "Slett" }).click();
  await expect(created).toHaveCount(0);
});

test("uten innlogging vises en lenke til /login i stedet for skjemaet", async ({
  page,
}) => {
  await page.goto("/tasks");

  await expect(page.getByTestId("login-to-create")).toBeVisible();
  await expect(page.getByLabel("Ny oppgave")).toHaveCount(0);
});

test("vanlig bruker ser ingen slett-knapp, og API-et svarer 403 uansett", async ({
  page,
}) => {
  await logInAs(page, "Bruker");

  // UI-et: useAuth() sier at vi ikke er admin, så TaskItem tegner ikke knappen.
  await expect(taskItems(page).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Slett" })).toHaveCount(0);

  // Men en skjult knapp er ikke en vakt. Vi kaller ruta direkte, med samme
  // cookie som nettleseren har (`page.request` deler cookies med siden).
  const count = await taskItems(page).count();
  const list = await page.request.get("/api/tasks");
  const { data } = (await list.json()) as { data: { id: string }[] };

  const response = await page.request.delete(`/api/tasks/${data[0].id}`);

  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({
    error: { code: "FORBIDDEN" },
  });

  // Serveren sa nei, så lista er uendret.
  await page.reload();
  await expect(taskItems(page)).toHaveCount(count);
});

test("admin sletter via DELETE /api/tasks/:id", async ({ page }) => {
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

test("filteret legger søket i URL-en, og lista filtreres", async ({ page }) => {
  await page.goto("/tasks");

  // Et vanlig GET-skjema. Nettleseren lager ?q=...&completed=... selv.
  await page.getByLabel("Søk").fill("Lese leksjonen");
  await page.getByRole("button", { name: "Filtrer" }).click();

  await expect(page).toHaveURL(/\/tasks\?q=Lese\+leksjonen&completed=$/);
  await expect(taskItems(page)).toHaveCount(1);
  await expect(taskItems(page)).toContainText("Lese leksjonen før timen");

  // URL-en ER tilstanden: last på nytt, og søket står der fortsatt.
  await page.reload();
  await expect(page.getByLabel("Søk")).toHaveValue("Lese leksjonen");
  await expect(taskItems(page)).toHaveCount(1);
});

test("ugyldig parameter i URL-en gir feilmelding, ikke krasj", async ({
  page,
}) => {
  await page.goto("/tasks?limit=tull");

  await expect(page.getByRole("alert")).toContainText(
    "limit må være et heltall"
  );
});
