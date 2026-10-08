// INTEGRASJONSTEST: ekte service + ekte repository + ekte SQL, men databasen
// er SQLite i minnet (better-sqlite3) i stedet for D1.
//
// Det er dependency injection som gjør dette mulig. Appen kobler
//   createTaskService(createTaskRepository(d1))
// og testen kobler
//   createTaskService(createTaskRepository(sqliteIMinnet))
// Servicen og repositoryet merker ingen forskjell. Begge er SQLite, og begge
// er `SQLiteAsyncDatabase` i Drizzle, så samme kode kjører mot begge.
//
// Kjører i Node (standard i vitest.config.ts). Ingen server, ingen worker,
// og hele fila tar millisekunder.
import { beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { relations } from "@/db/relations";
import { tasks, users } from "@/db/schema";
import { DEMO_USERS } from "@/features/auth/demo-user";
import type { Result } from "@/lib/result";
import { createTaskRepository } from "../task-repository";
import { createTaskService, type TaskService } from "../task-service";

// Samme brukere som appen. Begge har id 1, som vi legger inn i beforeEach.
const admin = DEMO_USERS.admin;
const bruker = DEMO_USERS.bruker;

let db: BetterSQLite3Database<typeof relations>;
let service: TaskService;

/**
 * Sjekker at et Result er en suksess, og forteller TypeScript det samme.
 *
 * `expect(result.success).toBe(true)` sjekker verdien når testen kjører, men
 * TypeScript ser ikke det, og nekter oss å lese `result.data` etterpå.
 * `asserts result is ...` er et løfte til TypeScript: "returnerer denne
 * funksjonen, så er result en suksess". Etter kallet er `result.data` trygg.
 *
 * Feiler den, får testen feilkoden og meldingen fra servicen, ikke bare
 * "expected false to be true".
 */
function expectSuccess<T>(
  result: Result<T>,
): asserts result is { success: true; data: T } {
  if (!result.success) {
    throw new Error(
      `Forventet suksess, fikk ${result.error.code}: ${result.error.message}`,
    );
  }
}

beforeEach(async () => {
  // Ny, tom database for HVER test. Da kan ingen test ødelegge for en annen.
  const sqlite = new Database(":memory:");
  db = drizzle({ client: sqlite, relations });

  // Samme migrasjoner som D1 får med `npm run migrate:dev`. Tabellene i
  // testen er altså nøyaktig de samme som i appen.
  migrate(db, { migrationsFolder: "./drizzle/migrations" });

  // Oppgaver krever en eier (fremmednøkkel), så brukeren må inn først.
  await db
    .insert(users)
    .values({ id: bruker.id, name: bruker.name, email: bruker.email });

  // Her er hele poenget: vi bygger servicen med VÅR database.
  service = createTaskService(createTaskRepository(db));
});

describe("taskService.create", () => {
  it("lagrer oppgaven og gir den en id", async () => {
    const result = await service.create(bruker, { title: "Skrive obligen" });

    expectSuccess(result);
    expect(result.data.id).toEqual(expect.any(String));
    expect(result.data).toMatchObject({
      title: "Skrive obligen",
      completed: false,
    });
  });

  it("trimmer tittelen", async () => {
    const result = await service.create(bruker, { title: "  Mellomrom  " });

    expectSuccess(result);
    expect(result.data.title).toBe("Mellomrom");
  });

  it("avviser tom tittel med BAD_REQUEST og feil per felt", async () => {
    const result = await service.create(bruker, { title: "   " });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: "BAD_REQUEST",
        fieldErrors: { title: [expect.any(String)] },
      },
    });
  });

  it("avviser frist i fortiden, via validateTask", async () => {
    // Zod godtar datoen, det er formen. Regelen i validateTask stopper den.
    const result = await service.create(bruker, {
      title: "For sent",
      dueDate: "2000-01-01",
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: "BAD_REQUEST",
        fieldErrors: { dueDate: ["Fristen kan ikke være før i dag"] },
      },
    });
  });

  it("gir feil per felt når dueDate ikke er en dato", async () => {
    const result = await service.create(bruker, {
      title: "Rar frist",
      dueDate: "tull",
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: "BAD_REQUEST",
        fieldErrors: { dueDate: [expect.stringContaining("dato")] },
      },
    });
  });

  it("ignorerer id og eier fra klienten", async () => {
    // Klienten prøver å sette id og eier selv. Zod skal kaste begge.
    const result = await service.create(bruker, {
      title: "Lur",
      id: "min-egen-id",
      userId: 999,
    });

    expectSuccess(result);
    expect(result.data.id).not.toBe("min-egen-id");

    // DTO-en har ikke userId (se task-mapper.ts), så vi spør databasen direkte
    // for å se hvem som faktisk ble eier.
    const row = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, result.data.id))
      .get();
    expect(row?.userId).toBe(bruker.id);
  });

  it("gir INTERNAL_SERVER_ERROR når eieren ikke finnes", async () => {
    // Fremmednøkkelen slår til i databasen. Repositoryet fanger feilen og
    // gjør den om til et Result i stedet for å kaste.
    const result = await service.create(
      { ...bruker, id: 999 },
      { title: "Uten eier" },
    );

    expect(result).toMatchObject({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
  });
});

describe("taskService.list og get", () => {
  it("lister alle oppgavene", async () => {
    await service.create(bruker, { title: "En" });
    await service.create(bruker, { title: "To" });

    const result = await service.list(null);

    expectSuccess(result);
    expect(result.data.map((task) => task.title).sort()).toEqual(["En", "To"]);
  });

  // Params kommer som tekst, slik parseParams gir dem. Ekte SQL kjører:
  // WHERE completed = ? AND title LIKE ? LIMIT ?
  it("filtrerer på params", async () => {
    await service.create(bruker, { title: "Skrive obligen", completed: true });
    await service.create(bruker, { title: "Lese obligen" });
    await service.create(bruker, { title: "Handle mat" });

    const result = await service.list(null, { completed: "false", q: "oblig" });

    expectSuccess(result);
    expect(result.data.map((task) => task.title)).toEqual(["Lese obligen"]);
  });

  it("avviser ugyldige params med BAD_REQUEST og feil per felt", async () => {
    const result = await service.list(null, { limit: "ti" });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: "BAD_REQUEST",
        fieldErrors: { limit: [expect.any(String)] },
      },
    });
  });

  it("gir NOT_FOUND for en id som ikke finnes", async () => {
    const result = await service.get(null, "finnesikke");

    expect(result).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND" },
    });
  });
});

describe("taskService.update", () => {
  it("endrer bare feltene som sendes", async () => {
    const created = await service.create(bruker, { title: "Før" });
    expectSuccess(created);

    const result = await service.update(bruker, created.data.id, {
      completed: true,
    });

    expectSuccess(result);
    expect(result.data).toMatchObject({ title: "Før", completed: true });
  });

  it("gir NOT_FOUND i stedet for å late som det gikk bra", async () => {
    const result = await service.update(bruker, "finnesikke", {
      completed: true,
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND" },
    });
  });

  it("avviser en update uten felter med BAD_REQUEST, ikke 500", async () => {
    const created = await service.create(bruker, { title: "Uendret" });
    expectSuccess(created);

    // `{}` er gyldig form, men Drizzle kaster på en UPDATE uten verdier.
    const result = await service.update(bruker, created.data.id, {});

    expect(result).toMatchObject({
      success: false,
      error: { code: "BAD_REQUEST" },
    });
  });

  it("fjerner fristen når dueDate er null", async () => {
    const created = await service.create(bruker, {
      title: "Med frist",
      dueDate: "2099-12-31",
    });
    expectSuccess(created);

    const result = await service.update(bruker, created.data.id, {
      dueDate: null,
    });

    expectSuccess(result);
    expect(result.data.dueDate).toBeNull();
  });
});

describe("taskService.remove", () => {
  it("sletter oppgaven", async () => {
    const created = await service.create(bruker, { title: "Slett meg" });
    expectSuccess(created);

    const removed = await service.remove(admin, created.data.id);
    expectSuccess(removed);

    // Sjekk at den faktisk er borte, ikke bare at kallet svarte ok.
    const after = await service.get(admin, created.data.id);
    expect(after).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND" },
    });
  });

  it("gir NOT_FOUND når oppgaven allerede er slettet", async () => {
    const result = await service.remove(admin, "finnesikke");

    expect(result).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND" },
    });
  });
});

// Tilgang testes mot SERVICEN, ikke mot rutene. Det er her regelen bor, og
// da vet vi at den gjelder for API, server actions og sider på én gang.
describe("tilgang", () => {
  it("krever innlogging for å lage en oppgave", async () => {
    const result = await service.create(null, { title: "Anonym" });

    expect(result).toMatchObject({
      success: false,
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("krever innlogging for å endre en oppgave", async () => {
    const created = await service.create(bruker, { title: "Min" });
    expectSuccess(created);

    const result = await service.update(null, created.data.id, {
      completed: true,
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("nekter vanlig bruker å slette, og oppgaven blir stående", async () => {
    const created = await service.create(bruker, { title: "Bli her" });
    expectSuccess(created);

    const result = await service.remove(bruker, created.data.id);

    expect(result).toMatchObject({
      success: false,
      error: { code: "FORBIDDEN" },
    });
    expectSuccess(await service.get(bruker, created.data.id));
  });

  it("sier 401 før 404, så uinnloggede ikke kan gjette id-er", async () => {
    const result = await service.remove(null, "finnesikke");

    expect(result).toMatchObject({
      success: false,
      error: { code: "UNAUTHORIZED" },
    });
  });
});
