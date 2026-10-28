import { z } from "zod";

const BASE_URL = "http://localhost:5173/api/v1";

export const ApiTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

export type ApiTask = z.infer<typeof ApiTaskSchema>;

export async function listTasks(): Promise<ApiTask[]> {
  const response = await fetch(`${BASE_URL}/tasks`);

  if (!response.ok) {
    throw new Error(`Kunne ikke hente oppgaver (${response.status})`);
  }

  const json = await response.json();
  return z.object({ data: z.array(ApiTaskSchema) }).parse(json).data;
}

export async function createTask(input: {
  title: string;
  completed: boolean;
}): Promise<ApiTask> {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json.error?.fieldErrors?.title?.[0] ??
        json.error?.message ??
        `Kunne ikke lagre oppgaven (${response.status})`,
    );
  }

  return z.object({ data: ApiTaskSchema }).parse(json).data;
}

export async function updateTask(
  id: string,
  input: { completed: boolean },
): Promise<ApiTask> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json.error?.message ?? `Kunne ikke oppdatere oppgaven (${response.status})`,
    );
  }

  return z.object({ data: ApiTaskSchema }).parse(json).data;
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (response.ok) return;

  const json = await response.json();
  throw new Error(
    json.error?.message ?? `Kunne ikke slette oppgaven (${response.status})`,
  );
}
