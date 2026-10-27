import { Platform } from "react-native";
import { z } from "zod";

// Android-emulatoren når Macen via 10.0.2.2. localhost er emulatoren selv.
const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
export const BASE_URL = `http://${HOST}:5173/api/v1`;

export const ApiTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

export type ApiTask = z.infer<typeof ApiTaskSchema>;

// Hver funksjon tar imot tokenet fra innloggingen og sender det i
// `Authorization`. Det er mobilens versjon av cookien i nettleseren.
export async function listTasks(token: string): Promise<ApiTask[]> {
  const response = await fetch(`${BASE_URL}/tasks`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Kunne ikke hente oppgaver (${response.status})`);
  }

  const json = await response.json();
  return z.object({ data: z.array(ApiTaskSchema) }).parse(json).data;
}

export async function createTask(
  token: string,
  input: {
    title: string;
    completed: boolean;
  },
): Promise<ApiTask> {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
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
  token: string,
  id: string,
  input: { completed: boolean },
): Promise<ApiTask> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
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

export async function deleteTask(token: string, id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });

  if (response.ok) return;

  const json = await response.json();
  throw new Error(
    json.error?.message ?? `Kunne ikke slette oppgaven (${response.status})`,
  );
}
