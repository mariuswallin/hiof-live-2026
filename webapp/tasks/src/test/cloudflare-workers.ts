/**
 * Erstatter `cloudflare:workers` i Vitest (se alias i vitest.config.ts).
 *
 * Modulen finnes bare inne i workerd. task-repository.ts lager instansen sin
 * med `db`, som leser `env.DB` herfra. Testene bruker aldri den instansen,
 * de lager sin egen med SQLite i minnet:
 *
 *   createTaskService(createTaskRepository(testDb))
 *
 * Men importen må likevel kunne lastes, og det er alt denne fila gjør.
 */
export const env = {} as Env;
