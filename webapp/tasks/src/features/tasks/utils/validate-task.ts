import { startOfToday } from "./date";

export const TITLE_MAX_LENGTH = 200;
export const TIME_ZONE = "Europe/Oslo";
export type TaskField = "title" | "dueDate";

export type TaskValidation =
  | { ok: true }
  | { ok: false; field: TaskField; error: string };

export function validateTask(
  task: { title?: string; dueDate?: Date | null },
  now: Date = new Date(),
): TaskValidation {
  if (task.title !== undefined) {
    const title = task.title.trim();
    if (title.length === 0) {
      return { ok: false, field: "title", error: "Tittel kan ikke være tom" };
    }
    if (title.length > TITLE_MAX_LENGTH) {
      return {
        ok: false,
        field: "title",
        error: `Tittel kan være maks ${TITLE_MAX_LENGTH} tegn`,
      };
    }
  }

  if (task.dueDate && task.dueDate < startOfToday(now)) {
    return {
      ok: false,
      field: "dueDate",
      error: "Fristen kan ikke være før i dag",
    };
  }

  return { ok: true };
}
