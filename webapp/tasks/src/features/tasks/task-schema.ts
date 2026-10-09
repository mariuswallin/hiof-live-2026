import z from "zod";

export const createTaskSchema = z.object({
  title: z.string("Tittel må være tekst").trim(),
  completed: z.boolean().optional(),
  dueDate: z.coerce
    .date("dueDate må være data, eks. 2026-10-01")
    .nullable()
    .optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
