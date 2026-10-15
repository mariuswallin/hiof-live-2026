import { z } from "zod";

/**
 * Et gratis test-API: https://dummyjson.com
 *
 * Vi validerer svaret med zod. Data fra nettet er `unknown` til det motsatte
 * er bevist - her får vi både sjekken og TypeScript-typen fra samme skjema.
 */
const BASE_URL = "https://dummyjson.com";

/** Ressursene vi bruker. dummyjson har flere (posts, products ...). */
type Resource = "users" | "todos";

export const TodoSchema = z.object({
  id: z.number(),
  todo: z.string(),
  completed: z.boolean(),
  userId: z.number(),
});

export type Todo = z.infer<typeof TodoSchema>;

export const UserSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  image: z.string(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Felles for begge hjelperne under: fetch + sjekk status.
 *
 * NB: fetch kaster IKKE ved 404/500 - bare ved nettverksfeil. Derfor må vi
 * sjekke response.ok selv.
 *
 * `signal` lar kalleren avbryte forespørselen (se useEffect i users/).
 */
async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`Kunne ikke hente ${path} (${response.status})`);
  }

  return response.json();
}

/**
 * LIST: GET /users, GET /todos ...
 *
 * dummyjson pakker lista inn i et objekt med SAMME NAVN som ressursen:
 *   GET /users -> { users: [...], total, skip, limit }
 * Vi trenger bare selve lista.
 *
 * `query` er resten av URL-en, f.eks. "limit=10".
 */
export async function list<T>(
  resource: Resource,
  schema: z.ZodType<T>,
  query = "",
  signal?: AbortSignal,
): Promise<T[]> {
  const json = await getJson(`/${resource}?${query}`, signal);
  const page = z.object({ [resource]: z.array(schema) }).parse(json);
  return page[resource];
}

/** BY ID: GET /users/68, GET /todos/3 ... -> ett objekt. */
export async function getById<T>(
  resource: Resource,
  id: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const json = await getJson(`/${resource}/${id}`, signal);
  return schema.parse(json);
}

/**
 * Ferdige kall for skjermene. De vet ikke noe om URL-er eller skjemaer -
 * de ber bare om "brukere" eller "oppgave 3".
 */

/**
 * De første 10 brukerne. select= ber API-et bare om feltene UserSchema
 * trenger (id kommer alltid med), så svaret blir mye mindre.
 */
export function listUsers(signal?: AbortSignal) {
  return list(
    "users",
    UserSchema,
    "limit=10&select=firstName,lastName,email,image",
    signal,
  );
}

export function getUser(id: string, signal?: AbortSignal) {
  return getById("users", id, UserSchema, signal);
}

/** De 8 første oppgavene (id 1-8). */
export function listTodos(signal?: AbortSignal) {
  return list("todos", TodoSchema, "limit=8", signal);
}

export function getTodo(id: string, signal?: AbortSignal) {
  return getById("todos", id, TodoSchema, signal);
}
