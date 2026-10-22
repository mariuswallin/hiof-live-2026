/**
 * Stands in for `cloudflare:workers` in Vitest, see `vitest.config.ts`.
 *
 * Empty on purpose: `src/db/index.ts` can load, but a query through `db`
 * fails. A test that needs the database passes in a better-sqlite3 client.
 */
export const env: Partial<Env> = {};
