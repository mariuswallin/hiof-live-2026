// End to end-test for innlogging. Kjør med:
//   npm run test:e2e
//
// Enhetstestene (src/features/auth/__tests__) sjekker funksjonene hver for
// seg. Her sjekker vi det bare en ekte nettleser kan vise: at cookien faktisk
// blir satt, at JavaScript ikke får lese den, og at redirectene henger sammen.
import { test, expect } from "@playwright/test";
import { logInAs, waitForHydration } from "./helpers";

test("innlogging setter en signert HttpOnly-cookie", async ({ page }) => {
  await logInAs(page, "Admin");

  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name === "session");

  // Attributtene serveren satte i Set-Cookie (session.ts).
  expect(session).toMatchObject({
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  });
  // Verdien er lesbar, men har en signatur hengende på (sign.ts).
  expect(session?.value).toMatch(/^kari:admin\.[0-9a-f]{64}$/);

  // HttpOnly: nettleseren SENDER cookien, men JavaScript på siden ser den ikke.
  expect(await page.evaluate(() => document.cookie)).not.toContain("session");
});

test("en cookie du har skrevet selv, gir ikke innlogging", async ({
  page,
  baseURL,
}) => {
  // Det samme som `curl -H "Cookie: session=kari:admin"`: riktig form, men
  // uten signatur.
  await page.context().addCookies([
    { name: "session", value: "kari:admin", url: baseURL },
  ]);

  await page.goto("/tasks");

  await expect(page.getByTestId("logged-in-as")).toHaveText("Ikke innlogget");
});

test("/profile sender uinnloggede til /login", async ({ page }) => {
  await page.goto("/profile");

  // requireUserPage svarte 302, og nettleseren fulgte Location.
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Logg inn" })).toBeVisible();
});

test("lenken til Min side stoppes av samme vakt ved klientnavigasjon", async ({
  page,
}) => {
  await page.goto("/tasks");
  await waitForHydration(page);

  // Nå henter rwsdk siden med fetch i stedet for en full omlasting. Vakten er
  // den samme, for den står på RUTA.
  await page.getByRole("link", { name: "Min side" }).click();

  await expect(page).toHaveURL(/\/login$/);
});

test("/profile viser ctx.user for den som er innlogget", async ({ page }) => {
  await logInAs(page, "Bruker", "Ola Hansen");

  await page.getByRole("link", { name: "Min side" }).click();

  await expect(page.getByTestId("profile-name")).toHaveText("Ola Hansen");
  await expect(page.getByTestId("profile-role")).toHaveText("user");
});

test("logg ut sletter cookien", async ({ page }) => {
  await logInAs(page, "Bruker");

  await page.getByRole("button", { name: "Logg ut" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("logged-in-as")).toHaveText("Ikke innlogget");

  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "session")).toBeUndefined();
});
