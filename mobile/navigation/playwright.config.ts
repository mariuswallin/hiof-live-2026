import { defineConfig, devices } from "@playwright/test";

/**
 * E2E med Playwright - mot WEB-versjonen av appen.
 *
 * Expo Router gir oss web "gratis" fra samme kode, så vi kan teste ekte
 * navigasjonsflyt (klikk -> ny URL -> ny skjerm) i en nettleser. For e2e på
 * ekte iOS/Android brukes typisk Maestro eller Detox - men der er det mye
 * tyngre å mocke API-et.
 *
 * Kjør: pnpm e2e       (starter Expo web selv, kjører testene, stopper)
 *       pnpm e2e:ui    (Playwrights UI - se hvert steg)
 *
 * Første gang: npx playwright install chromium
 */
const PORT = 8082;

export default defineConfig({
  testDir: "./e2e",
  // Expo web bygges ved første request - gi litt ekstra tid.
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Mobilstørrelse, siden det er en mobilapp.
    ...devices["iPhone 13"],
    // Bruk Chromium også for iPhone-profilen (slipper å installere WebKit).
    browserName: "chromium",
    trace: "on-first-retry",
  },
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    // CI=1: ikke interaktiv, ikke vent på tastetrykk.
    env: { CI: "1" },
  },
});
