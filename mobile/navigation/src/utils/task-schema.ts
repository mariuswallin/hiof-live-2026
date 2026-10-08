import { z } from "zod";

/**
 * Samme Task-skjema som i demo-appen (src/utils/task-schema.ts), med to
 * tillegg: trim() på tittelen og norske feilmeldinger.
 */
export const TaskSchema = z.object({
  id: z.string().min(1, "id kan ikke være tom"),
  title: z.string().trim().min(3, "Tittel må ha minst 3 tegn"),
  done: z.boolean().default(false),
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * En ny oppgave = alt unntatt id (id-en lager TasksProvider).
 * done har default(false), så parse({ title }) gir { title, done: false } -
 * akkurat det add() i TasksContext tar imot.
 */
export const NewTaskSchema = TaskSchema.omit({ id: true });

export type NewTask = z.infer<typeof NewTaskSchema>;
