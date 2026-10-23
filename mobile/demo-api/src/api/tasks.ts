// STEG 0: listTasks, createTask -> brukes i contexts/TasksContext.tsx
// STEG 1: updateTask, deleteTask -> brukes i contexts/TasksContext.tsx
// STEG 2: getTask -> brukes i app/(tabs)/tasks/[id].tsx (detaljsiden)
import { z } from "zod";

/**
 * STEG 0: VÅRT EGET API: webapp/tasks, i stedet for dummyjson.
 * Start webappen først: `npm run dev` i webapp/tasks.
 *
 * localhost virker i iOS-simulatoren, fordi den kjører på Mac-en.
 * Andre steder er "localhost" en annen maskin:
 *   Android-emulator: http://10.0.2.2:5173/api/v1
 *   Fysisk telefon:   http://<Mac-ens IP>:5173/api/v1  (og `npm run dev -- --host`)
 * På web stopper nettleseren kallet (CORS), med mindre webappen tillater det.
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

/** STEG 0 - LIST: GET /api/v1/tasks -> { ok: true, data: [...] } */
export async function listTasks(): Promise<ApiTask[]> {
  const response = await fetch(`${BASE_URL}/tasks`);

  if (!response.ok) {
    throw new Error(`Kunne ikke hente oppgaver (${response.status})`);
  }

  const json = await response.json();
  return z.object({ data: z.array(ApiTaskSchema) }).parse(json).data;
}

/**
 * STEG 0 - CREATE: POST /api/v1/tasks med JSON i body.
 *   201 -> { ok: true, data: {...} }   oppgaven, med id-en SERVEREN laget
 *   400 -> { ok: false, error: {...} } f.eks. tom tittel
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
    // Feilen for selve feltet ("Tittel kan ikke være tom") er mer nyttig
    // for brukeren enn den generelle meldingen ("Ikke gyldig data").
    throw new Error(
      json.error?.fieldErrors?.title?.[0] ??
        json.error?.message ??
        `Kunne ikke lagre oppgaven (${response.status})`,
    );
  }

  return z.object({ data: ApiTaskSchema }).parse(json).data;
}

/**
 * STEG 1 - UPDATE: PATCH /api/v1/tasks/:id med bare feltene som endres.
 *   200 -> { ok: true, data: {...} }   oppgaven slik den er NÅ på serveren
 *   404 -> { ok: false, error: {...} } finnes ikke (slettet et annet sted?)
 */
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

/**
 * STEG 1 - DELETE: DELETE /api/v1/tasks/:id
 *   204 -> INGEN body. "OK, og jeg har ingenting å sende tilbake."
 *   404 -> { ok: false, error: {...} }
 *   500 -> { ok: false, error: {...} } webappen feiler med vilje ca. hver
 *          tredje gang i dev (demo-chaos.ts), så vi får øvd på feil.
 */
export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  // Sjekk ok FØR vi leser body: response.json() på en tom 204 kaster.
  if (response.ok) return;

  const json = await response.json();
  throw new Error(
    json.error?.message ?? `Kunne ikke slette oppgaven (${response.status})`,
  );
}

/**
 * STEG 2 - BY ID: GET /api/v1/tasks/:id -> { ok: true, data: {...} }
 *
 * Detaljsiden viser MER enn lista: når oppgaven ble laget, og fristen.
 * Webappen sender dem allerede - ApiTaskSchema over kaster dem bare bort.
 * .extend() lager et nytt skjema med feltene i tillegg.
 */
export const ApiTaskDetailSchema = ApiTaskSchema.extend({
  // ISO-strenger: "2026-10-22T07:22:43.000Z". null = ingen frist.
  dueDate: z.string().nullable(),
  createdAt: z.string(),
});

export type ApiTaskDetail = z.infer<typeof ApiTaskDetailSchema>;

export async function getTask(id: string): Promise<ApiTaskDetail> {
  const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error(`Kunne ikke hente oppgave ${id} (${response.status})`);
  }

  const json = await response.json();
  return z.object({ data: ApiTaskDetailSchema }).parse(json).data;
}
