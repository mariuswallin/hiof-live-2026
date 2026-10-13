// Definere ZOD-schema

import z from "zod";

// Lage valideringsfunksjon hvor vi bruker Zod og kanskje har egne regler
// ex. dueDate ikke er eldre enn dagens dato eller at tittel inneholder "@"

export const createTaskSchema = z.object({
  title: z.string("Tittel må være tekst").trim(),
  completed: z.boolean().optional(),
  dueDate: z.coerce
    .date("Duedate må være på formen 2026-10-01")
    .nullable()
    .optional(),
});

export const updateTaskeSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskeSchema>;
