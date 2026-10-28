/**
 * Bitteliten promise-cache - det use() trenger for å virke.
 *
 * use(promise) krever SAMME promise ved hver render. Skriver vi
 *   use(getTodo(id))
 * rett i komponenten, starter hver render et NYTT kall. React venter på det,
 * rendrer på nytt når svaret kommer - og starter et nytt kall igjen. Evig løkke.
 *
 * Løsningen: ta vare på promiset under en nøkkel. Første kall starter
 * hentingen, alle senere får samme promise tilbake. (TanStack Query gjør det
 * samme - med mye mer i tillegg.)
 *
 * Cachen lever i JS-minnet: til appen lukkes eller refreshes.
 */
const promises = new Map<string, Promise<unknown>>();

export function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = promises.get(key);
  if (existing) return existing as Promise<T>;

  const promise = load();
  promises.set(key, promise);
  return promise;
}

/**
 * Glem et promise, så neste cached() henter på nytt. Brukes av "Prøv igjen"
 * i en ErrorBoundary.
 *
 * Hvorfor ikke glemme det automatisk når det feiler? Fordi React rendrer
 * komponenten på nytt for å LESE feilen - og må da få samme (feilede)
 * promise. Får den et nytt, venter den på nytt, feiler på nytt ... evig løkke.
 */
export function forget(key: string) {
  promises.delete(key);
}

/**
 * Glem ALT. Brukes når noen logger inn eller ut (AuthContext.tsx).
 *
 * Alt i cachen ble hentet med forrige brukers token. Lar vi det ligge, ser
 * neste bruker forrige brukers liste - eller sin egen, gamle liste fra sist
 * hen var innlogget.
 */
export function clear() {
  promises.clear();
}
