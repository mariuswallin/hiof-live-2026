// Enhetstest av mapperen. Ren funksjon: rad inn, DTO ut.
import { describe, expect, it } from "vitest";
import type { Task } from "@/db/schema";
import { toTaskDTO } from "../task-mapper";

const row: Task = {
  id: "abc",
  title: "Skrive obligen",
  completed: false,
  dueDate: new Date("2026-10-01T10:00:00.000Z"),
  userId: 1,
  createdAt: new Date("2026-09-01T08:00:00.000Z"),
};

describe("toTaskDTO", () => {
  it("gjør datoer om til ISO-strenger", () => {
    expect(toTaskDTO(row)).toEqual({
      id: "abc",
      title: "Skrive obligen",
      completed: false,
      dueDate: "2026-10-01T10:00:00.000Z",
      createdAt: "2026-09-01T08:00:00.000Z",
    });
  });

  it("gir null når oppgaven ikke har frist", () => {
    expect(toTaskDTO({ ...row, dueDate: null }).dueDate).toBeNull();
  });

  it("sender ikke ut interne felter", () => {
    expect(toTaskDTO(row)).not.toHaveProperty("userId");
  });

  it("lekker ikke nye kolonner av seg selv", () => {
    // Later som tabellen har fått en kolonne mapperen ikke kjenner. Med
    // `{ ...task }` i mapperen ville denne testen feilet.
    const rowWithSecret = { ...row, internalNote: "hemmelig" };

    expect(toTaskDTO(rowWithSecret)).not.toHaveProperty("internalNote");
  });
});
