import { beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { relations } from "@/db/relations";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { tasks, users } from "@/db/schema";
import { createTaskService, type TaskService } from "../task-service";
import { createTaskRepository } from "../task-repository";
import type { SessionUser } from "@/features/auth/auth-types";

const admin: SessionUser = {
  id: 1,
  name: "Lars Larsen",
  email: "test@testeren.no",
  role: "admin",
};

const ola: SessionUser = {
  id: 2,
  name: "Ola Hansen",
  email: "ola@example.com",
  role: "user",
};

let db: BetterSQLite3Database<typeof relations>;
let service: TaskService;

beforeEach(async () => {
  const sqlite = new Database(":memory:");
  db = drizzle({ client: sqlite, relations });
  migrate(db, { migrationsFolder: "./drizzle/migrations" });
  await db.insert(users).values([admin, ola]);
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

    const result = await service.list(admin);

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

    const result = await service.list(admin, {
      completed: "true",
      q: "to",
    });

    if (!result.ok) {
      throw new Error("Invalid result");
    }

    expect(result.data.map((task) => task.title).sort()).toEqual([
      "To",
      "Tre og to",
    ]);
  });

  it("uten bruker gir 401", async () => {
    const result = await service.list(null);

    expect(result).toMatchObject({ ok: false, error: { code: "401" } });
  });

  it("vanlig bruker ser bare sine egne, admin ser alle", async () => {
    await db.insert(tasks).values([
      { title: "Admin sin", userId: admin.id },
      { title: "Ola sin", userId: ola.id },
    ]);

    const asOla = await service.list(ola);
    const asAdmin = await service.list(admin);

    if (!asOla.ok || !asAdmin.ok) throw new Error("Invalid result");

    expect(asOla.data.map((task) => task.title)).toEqual(["Ola sin"]);
    expect(asAdmin.data.map((task) => task.title).sort()).toEqual([
      "Admin sin",
      "Ola sin",
    ]);
  });
});

describe("taskService.create", () => {
  it("lagrer oppgaven på innlogget bruker", async () => {
    const result = await service.create(ola, { title: "Skrive obligen" });

    if (!result.ok) throw new Error("Invalid result");

    const row = await db.query.tasks.findFirst({
      where: { id: result.data.id },
    });
    expect(row?.userId).toBe(ola.id);
  });

  it("uten bruker gir 401", async () => {
    const result = await service.create(null, { title: "Skrive obligen" });

    expect(result).toMatchObject({ ok: false, error: { code: "401" } });
  });
});

describe("taskService eiersjekk", () => {
  async function insertTask(title: string, userId: number) {
    return db.insert(tasks).values({ title, userId }).returning().get();
  }

  it("findById: vanlig bruker får 403 på andres oppgave", async () => {
    const adminTask = await insertTask("Admin sin", admin.id);

    const result = await service.findById(ola, adminTask.id);

    expect(result).toMatchObject({ ok: false, error: { code: "403" } });
  });

  it("findById: admin kan lese andres oppgave", async () => {
    const olaTask = await insertTask("Ola sin", ola.id);

    const result = await service.findById(admin, olaTask.id);

    expect(result.ok).toBe(true);
  });

  it("update: vanlig bruker får 403, og oppgaven er uendret", async () => {
    const adminTask = await insertTask("Admin sin", admin.id);

    const result = await service.update(ola, adminTask.id, { completed: true });

    expect(result).toMatchObject({ ok: false, error: { code: "403" } });
    const row = await db.query.tasks.findFirst({ where: { id: adminTask.id } });
    expect(row?.completed).toBe(false);
  });

  it("update: eieren kan endre sin egen", async () => {
    const olaTask = await insertTask("Ola sin", ola.id);

    const result = await service.update(ola, olaTask.id, { completed: true });

    if (!result.ok) throw new Error("Invalid result");
    expect(result.data.completed).toBe(true);
  });

  it("update: uten bruker gir 401", async () => {
    const olaTask = await insertTask("Ola sin", ola.id);

    const result = await service.update(null, olaTask.id, { completed: true });

    expect(result).toMatchObject({ ok: false, error: { code: "401" } });
  });
});
