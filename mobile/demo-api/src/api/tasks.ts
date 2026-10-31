// STEG 2A: alle kall tar `token` først og sender det i Authorization.
// contexts/AuthContext.tsx (token) -> contexts/TasksContext.tsx -> HER
// STEG 2B: getTask -> app/(tabs)/tasks/[id].tsx (detaljsiden)

import { Platform } from "react-native";
import { z } from "zod";

// STEG 2: Android-emulatoren når Macen via 10.0.2.2. localhost er emulatoren selv.
const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
// STEG 2A: eksportert, fordi api/auth.ts bruker den også.
export const BASE_URL = `http://${HOST}:5173/api/v1`;

export const ApiTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

export type ApiTask = z.infer<typeof ApiTaskSchema>;

// Hver funksjon tar imot tokenet fra innloggingen og sender det i
// `Authorization`. Det er mobilens versjon av cookien i nettleseren.
//
// STEG 2A: uten token svarer webappen 401 (requireUser i task-routes.ts).
// Lista er dessuten filtrert: Ola (user) ser bare sine, Kari (admin) ser alle.
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

// STEG 2A: bare admin får slette (requireAdmin). Ola får 403 og meldingen
// "Bare admin har lov til dette" - det er SERVEREN som bestemmer.
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

/**
 * STEG 2B - BY ID: GET /api/v1/tasks/:id -> { ok: true, data: {...} }
 *
 * Detaljsiden viser MER enn lista: når oppgaven ble laget, og fristen.
 * Webappen sender dem allerede - ApiTaskSchema over kaster dem bare bort.
 * .extend() lager et nytt skjema med feltene i tillegg.
 *
 * STEG 2A: token her også. Andres oppgave gir 403 for Ola.
 */
export const ApiTaskDetailSchema = ApiTaskSchema.extend({
  // ISO-strenger: "2026-10-22T07:22:43.000Z". null = ingen frist.
  dueDate: z.string().nullable(),
  createdAt: z.string(),
});

export type ApiTaskDetail = z.infer<typeof ApiTaskDetailSchema>;

export async function getTask(
  token: string,
  id: string,
): Promise<ApiTaskDetail> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Kunne ikke hente oppgave ${id} (${response.status})`);
  }

  const json = await response.json();
  return z.object({ data: ApiTaskDetailSchema }).parse(json).data;
}
