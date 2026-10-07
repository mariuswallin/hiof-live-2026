import { describe, expect, it } from "vitest";
import { toTaskDTO } from "../task-mapper";
import type { Task } from "@/db/schema";

const row: Task = {
  id: "abc",
  title: "Dette er tittelen",
  completed: false,
  userId: 1,
  dueDate: new Date("2026-10-01T10:00:00.000Z"),
  createdAt: new Date("2026-09-01T08:00:00.000Z"),
};

describe("toTaskDTO", () => {
  it("gjør datoer om til ISO-strenger", () => {
    const result = toTaskDTO(row);

    expect(result).toEqual({
      id: "abc",
      title: "Dette er tittelen",
      completed: false,
      dueDate: new Date("2026-10-01T10:00:00.000Z"),
      createdAt: "2026-09-01T08:00:00.000Z",
    });
  });
  it("gir null når oppgaven ikke har frist", () => {
    const result = toTaskDTO({ ...row, dueDate: null });

    expect(result.dueDate).toBeNull();
  });

  it("sender ikke ut interne felter", () => {
    const result = toTaskDTO(row);
    expect(result).not.toHaveProperty("userId");
  });
});
