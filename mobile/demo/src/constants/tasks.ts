import type { Task } from "@/utils_draft/task-schema";

/** Testdata til demoen. Byttes ut med et API senere. */
export const TASKS: Task[] = [
  { id: "1", title: "Lese om props", done: true },
  { id: "2", title: "Lage TaskItem", done: false },
  { id: "3", title: "Prøve FlatList", done: false },
  { id: "4", title: "Validere data med zod", done: false },
];
