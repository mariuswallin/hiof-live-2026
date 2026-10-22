import { z } from "zod";

/**
 * VÅRT EGET API: webapp/tasks i hiof-live-2026, i stedet for dummyjson.
 * Start webappen først: `npm run dev` i webapp/tasks.
 *
 * localhost virker i iOS-simulatoren (og på web), fordi den kjører på
 * Mac-en. Andre steder er "localhost" en annen maskin:
 *   Android-emulator: http://10.0.2.2:5173/api/v1
 *   Fysisk telefon:   http://<Mac-ens IP>:5173/api/v1
 */
const BASE_URL = "http://localhost:5173/api/v1";

/**
 * En oppgave slik webappen sender den (TaskDTO i task-mapper.ts).
 * Webappen sender også dueDate og createdAt - z.object() kaster felt den
 * ikke kjenner, så vi får bare det vi bruker.
 */
export const ApiTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

export type ApiTask = z.infer<typeof ApiTaskSchema>;

/**
 * Webappen pakker ALLE svar på samme måte (se task-controller.ts):
 *   { ok: true,  data: ... }
 *   { ok: false, error: { code: "400", message, fieldErrors } }
 *
 * NB: fetch kaster IKKE ved 400/404/500 - bare ved nettverksfeil (f.eks.
 * når webappen ikke kjører). Derfor sjekker vi response.ok selv.
 */

/** LIST: GET /api/v1/tasks -> { ok: true, data: [...] } */
export async function listTasks(): Promise<ApiTask[]> {
  const response = await fetch(`${BASE_URL}/tasks`);

  if (!response.ok) {
    throw new Error(`Kunne ikke hente oppgaver (${response.status})`);
  }

  const json = await response.json();
  return z.object({ data: z.array(ApiTaskSchema) }).parse(json).data;
}

/** BY ID: GET /api/v1/tasks/:id -> { ok: true, data: {...} } */
export async function getTask(id: string): Promise<ApiTask> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error(`Kunne ikke hente oppgave ${id} (${response.status})`);
  }

  const json = await response.json();
  return z.object({ data: ApiTaskSchema }).parse(json).data;
}

/**
 * CREATE: POST /api/v1/tasks med JSON i body.
 *   201 -> { ok: true, data: {...} }   oppgaven, med id-en SERVEREN laget
 *   400 -> { ok: false, error: {...} } f.eks. for lang tittel
 */
export async function createTask(input: {
  title: string;
  completed: boolean;
}): Promise<ApiTask> {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    // Forteller serveren at body er JSON.
    headers: { "content-type": "application/json" },
    // fetch sender tekst - objektet må gjøres om til en JSON-streng selv.
    body: JSON.stringify(input),
  });

  const json = await response.json();

  if (!response.ok) {
    // Feilen for selve feltet ("Tittel kan være maks 200 tegn") er mer nyttig
    // for brukeren enn den generelle meldingen ("Ikke gyldig data").
    throw new Error(
      json.error?.fieldErrors?.title?.[0] ??
        json.error?.message ??
        `Kunne ikke lagre oppgaven (${response.status})`,
    );
  }

  return z.object({ data: ApiTaskSchema }).parse(json).data;
}
