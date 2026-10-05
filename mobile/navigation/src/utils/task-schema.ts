import { z } from "zod";

/**
 * Samme Task-skjema som i demo-appen. Her trenger vi bare typen og
 * NewTaskSchema (til "ny oppgave"-modalen) - valideringsfunksjonene er
 * utelatt, siden fokuset i dette prosjektet er navigasjon.
 */
export const TaskSchema = z.object({
  id: z.string().min(1, "id kan ikke være tom"),
  title: z.string().trim().min(3, "Tittel må ha minst 3 tegn"),
  done: z.boolean(),
});

export type Task = z.infer<typeof TaskSchema>;

export const NewTaskSchema = TaskSchema.pick({ title: true });

export type NewTask = z.infer<typeof NewTaskSchema>;
