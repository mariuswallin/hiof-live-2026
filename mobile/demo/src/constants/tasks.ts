import type { Task } from "@/utils_draft/task-schema";

/** Testdata til demoen. Byttes ut med et API senere. */
export const TASKS: Task[] = [
  { id: "6", title: "Snakke med Supermann", done: false },
  { id: "7", title: "Rette eksamen", done: false },
  { id: "8", title: "Ferdigstille et prosjekt", done: true },
  { id: "1", title: "Lese om props", done: true },
  { id: "2", title: "Lage TaskItem", done: false },
  { id: "3", title: "Prøve FlatList", done: false },
  { id: "4", title: "Validere data med zod", done: false },
  { id: "5", title: "En oppgave", done: false },
];
