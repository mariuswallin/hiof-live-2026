import { initClient, initClientNavigation } from "rwsdk/client";

// Klientnavigasjon: interne lenker og `navigate()` henter bare
// server-komponentene på nytt, i stedet for å laste hele siden. TaskList og
// DemoUserPanel bruker `navigate()` for å hente ferske data fra serveren.
const { handleResponse, onHydrated } = initClientNavigation();

initClient({
  handleResponse,
  // Kjøres når React har tatt over siden (og etter hver navigasjon).
  // `<html data-hydrated="true">` er signalet e2e-testene venter på før de
  // klikker. Uten det rekker Playwright å trykke før React er koblet på, og
  // klikket forsvinner. Se waitForHydration i e2e/tasks.e2e.ts.
  onHydrated: (meta) => {
    onHydrated(meta);
    document.documentElement.dataset.hydrated = "true";
  },
});
