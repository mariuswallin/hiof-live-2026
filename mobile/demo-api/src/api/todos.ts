import { TaskSchema } from "@/utils/task-schema";
import z from "zod";

const BASE_URL = "https://dummyjson.com";

export const TodoSchema = z.object({
  id: z.number(),
  todo: z.string(),
  completed: z.boolean(),
  userId: z.number(),
});

export const TodoArraySchema = z.array(TodoSchema);

export async function listTodos() {
  try {
    const response = await fetch(`${BASE_URL}/todos`);
    console.log(response.status);
    const data = await response.json();
    // {todos: [{...}]}
    // {ok: true, data: [...]}
    if (!response.ok) {
      // Håndtere hva som kan ha skjedd her
    }
    console.log("Data", data);
    return TodoArraySchema.parse(data.todos);
  } catch (error) {
    // Her må vi være bevisst hva slags type feil vi får
    // 500
    // Konvertering til json
    // Validering av data med Zod
    // handlerError(error)
    console.log(error);
  }
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Kunne ikke hente data fra ${path} (${response.status})`);
  }
  return response.json();
}
