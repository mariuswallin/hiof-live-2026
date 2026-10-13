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

let db: BetterSQLite3Database<typeof relations>;
let service: TaskService;

beforeEach(async () => {
  const sqlite = new Database(":memory:");
  db = drizzle({ client: sqlite, relations });
  migrate(db, { migrationsFolder: "./drizzle/migrations" });
  await db.insert(users).values({
    id: 1,
    name: "Lars Larsen",
    email: "test@testeren.no",
  });
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

    const result = await service.list();

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

    const result = await service.list({
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
});
