import { z } from "zod";

/**
 * Et gratis test-API: https://dummyjson.com
 *
 * Vi validerer svaret med zod. Data fra nettet er `unknown` til det motsatte
 * er bevist - her får vi både sjekken og TypeScript-typen fra samme skjema.
 */
const BASE_URL = "https://dummyjson.com";

export const TodoSchema = z.object({
  id: z.number(),
  todo: z.string(),
  completed: z.boolean(),
  userId: z.number(),
});

export type Todo = z.infer<typeof TodoSchema>;

/** Svaret fra GET /todos: { todos: [...], total, skip, limit }. Vi trenger bare todos. */
export const TodosResponseSchema = z.object({
  todos: z.array(TodoSchema),
});

export const UserSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  image: z.string(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Felles hjelper: fetch + sjekk status + valider.
 *
 * NB: fetch kaster IKKE ved 404/500 - bare ved nettverksfeil. Derfor må vi
 * sjekke response.ok selv.
 *
 * `signal` lar kalleren avbryte forespørselen (se useEffect i [id].tsx).
 */
async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`Kunne ikke hente ${path} (${response.status})`);
  }

  return schema.parse(await response.json());
}

export function fetchTodo(id: string, signal?: AbortSignal) {
  return getJson(`/todos/${id}`, TodoSchema, signal);
}

export function fetchUser(id: string, signal?: AbortSignal) {
  return getJson(`/users/${id}`, UserSchema, signal);
}
