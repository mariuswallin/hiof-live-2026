/**
 * PARSE: query-parametrene i URL-en, som et vanlig objekt.
 *
 *   /api/tasks?completed=false&q=oblig   ->   { completed: "false", q: "oblig" }
 *
 * Alt er fortsatt TEKST. "false" er en streng, og en streng som ikke er tom er
 * sann: `Boolean("false")` er `true`. Hva verdiene betyr, og om de er lovlige,
 * avgjør validateListParams i validate-list-params.ts.
 *
 * Ikke det samme som `params` i rwsdk. Det er STI-parametere:
 *
 *   /api/tasks/:id      params.id              rwsdk gjør det for oss
 *   /api/tasks?q=oblig  parseParams(request)   denne
 *
 * Både controlleren og TasksPage har en Request, så begge bruker denne.
 */
export type Params = Record<string, string | undefined>;

export function parseParams(request: Request): Params {
  // URL tar seg av %20, æ, ø, å og resten av kodingen. Står samme navn to
  // ganger (?q=a&q=b), vinner det siste.
  return Object.fromEntries(new URL(request.url).searchParams);
}
