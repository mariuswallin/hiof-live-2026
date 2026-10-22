import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().min(1, "Id is required"),
  title: z.string().min(3, "Title is required"),
  done: z.boolean().default(false),
});

export type Task = z.infer<typeof TaskSchema>;
