import { beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { relations } from "@/db/relations";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { tasks, users } from "@/db/schema";
import type { SessionUser } from "@/features/auth/auth-types";
import { createTaskService, type TaskService } from "../task-service";
import { createTaskRepository } from "../task-repository";

let db: BetterSQLite3Database<typeof relations>;
let service: TaskService;

// Rollen ligger på brukeren i databasen. Kari er admin, de to andre er
// vanlige brukere.
const kari: SessionUser = {
  id: 1,
  name: "Kari Nordmann",
  email: "kari@example.com",
  role: "admin",
};
const ola: SessionUser = {
  id: 2,
  name: "Ola Hansen",
  email: "ola@example.com",
  role: "user",
};
const lise: SessionUser = {
  id: 3,
  name: "Lise Berg",
  email: "lise@example.com",
  role: "user",
};

beforeEach(async () => {
  const sqlite = new Database(":memory:");
  db = drizzle({ client: sqlite, relations });
  migrate(db, { migrationsFolder: "./drizzle/migrations" });
  await db.insert(users).values([kari, ola, lise]);
  service = createTaskService(createTaskRepository(db));
});

describe("taskService.list", () => {
  it("lister alle oppgaver", async () => {
    await db.insert(tasks).values({
      title: "En",
      completed: false,
      userId: 1,
    });

    await db.insert(tasks).values({
      title: "To",
      completed: true,
      userId: 1,
    });

    const result = await service.list({}, kari);

    if (!result.ok) {
      throw new Error("Invalid result");
    }

    expect(result.ok).toBe(true);
    expect(result.data.map((task) => task.title).sort()).toEqual(["En", "To"]);
  });
  it("filtrerer med params", async () => {
    await db.insert(tasks).values({
      title: "En",
      completed: false,
      userId: 1,
    });

    await db.insert(tasks).values({
      title: "To",
      completed: true,
      userId: 1,
    });

    await db.insert(tasks).values({
      title: "Tre og to",
      completed: true,
      userId: 1,
    });

    const result = await service.list(
      {
        completed: "true",
        q: "to",
      },
      kari,
    );

    if (!result.ok) {
      throw new Error("Invalid result");
    }

    expect(result.data.map((task) => task.title).sort()).toEqual([
      "To",
      "Tre og to",
    ]);
  });
});

describe("taskService: hvem ser hva", () => {
  beforeEach(async () => {
    await db.insert(tasks).values([
      { title: "Kari sin", userId: kari.id },
      { title: "Ola sin", userId: ola.id },
    ]);
  });

  it("svarer 401 uten innlogging", async () => {
    const result = await service.list({}, null);

    expect(result).toMatchObject({ ok: false, error: { code: "401" } });
  });

  it("en vanlig bruker ser bare sine egne oppgaver", async () => {
    const result = await service.list({}, ola);

    if (!result.ok) throw new Error("Invalid result");

    expect(result.data.map((task) => task.title)).toEqual(["Ola sin"]);
  });

  it("admin ser oppgavene til alle, med eier på hver", async () => {
    const result = await service.list({}, kari);

    if (!result.ok) throw new Error("Invalid result");

    const owners = result.data.map((task) => `${task.title}: ${task.owner}`);
    expect(owners.sort()).toEqual(["Kari sin: kari", "Ola sin: ola"]);
  });
});

// Servicen er den siste sperra. Rutene har vakter (requireUser, requireAdmin),
// men server actions går ikke gjennom vaktene på API-rutene.
describe("taskService: tilgang", () => {
  it("create svarer 401 uten innlogging, og lagrer ingenting", async () => {
    const result = await service.create({ title: "Ny" }, null);

    expect(result).toMatchObject({ ok: false, error: { code: "401" } });
    expect(await db.select().from(tasks)).toHaveLength(0);
  });

  it("create lagrer oppgaven på den som er innlogget", async () => {
    const result = await service.create({ title: "Ny" }, ola);

    expect(result).toMatchObject({ ok: true, data: { owner: "ola" } });

    const [row] = await db.select().from(tasks);
    expect(row.userId).toBe(ola.id);

    // Ola ser den i lista si. Lise gjør det ikke.
    expect(await service.list({}, ola)).toMatchObject({
      data: [{ title: "Ny" }],
    });
    expect(await service.list({}, lise)).toMatchObject({ data: [] });
  });

  it("update svarer 401 uten innlogging", async () => {
    await db.insert(tasks).values({ id: "t1", title: "En", userId: ola.id });

    const result = await service.update("t1", { completed: true }, null);

    expect(result).toMatchObject({ ok: false, error: { code: "401" } });
  });

  it("update virker for en innlogget bruker", async () => {
    await db.insert(tasks).values({ id: "t1", title: "En", userId: ola.id });

    const result = await service.update("t1", { completed: true }, ola);

    expect(result).toMatchObject({
      ok: true,
      data: { completed: true, owner: "ola" },
    });
  });

  it("update svarer 404 når oppgaven ikke finnes", async () => {
    const result = await service.update("finnes-ikke", { completed: true }, ola);

    expect(result).toMatchObject({ ok: false, error: { code: "404" } });
  });

  it("remove svarer 401 uten innlogging", async () => {
    await db.insert(tasks).values({ id: "t1", title: "En", userId: ola.id });

    const result = await service.remove("t1", null);

    expect(result).toMatchObject({ ok: false, error: { code: "401" } });
  });

  it("remove svarer 403 for vanlig bruker, også på egen oppgave", async () => {
    await db.insert(tasks).values({ id: "t1", title: "En", userId: ola.id });

    const result = await service.remove("t1", ola);

    expect(result).toMatchObject({ ok: false, error: { code: "403" } });
    expect(await db.select().from(tasks)).toHaveLength(1);
  });

  it("remove sletter for admin", async () => {
    await db.insert(tasks).values({ id: "t1", title: "En", userId: ola.id });

    const result = await service.remove("t1", kari);

    expect(result).toEqual({ ok: true });
    expect(await db.select().from(tasks)).toHaveLength(0);
  });
});
