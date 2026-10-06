import type { Task } from "@/db/schema";

/**
 * MAPPER: fra databaserad til det klienten får se. Forenklet fra webapp-2025
 * (leksjon 18, "Mappers og DTO-er").
 *
 *   Task      raden slik den ligger i databasen (Drizzle, src/db/schema)
 *   TaskDTO   kontrakten utover: API-svar, props til komponenter
 *
 * DTO = Data Transfer Object. Det er en BEVISST liste over hva som sendes
 * ut. Tabellen kan endre seg uten at API-et gjør det, og omvendt.
 */
export type TaskDTO = {
  id: string;
  title: string;
  completed: boolean;
  // Datoer som ISO-strenger: det er det JSON uansett gjør med en Date, og nå
  // er typen ærlig om det. "2026-10-05T12:00:00.000Z"
  dueDate: string | null;
  createdAt: string;
};

/**
 * Plukker ut feltene ett for ett. IKKE `{ ...task }`.
 *
 * Med spread sender vi ut alt tabellen har, også det vi legger til senere.
 * Får tasks en kolonne `internalNote` neste uke, lekker den rett ut i
 * API-et uten at noen har bestemt det. Her må noen skrive den inn i
 * TaskDTO og i denne funksjonen først.
 *
 * `userId` er med vilje utelatt: klienten trenger ikke vite hvilken intern id
 * eieren har.
 *
 * TANKE: Hva om klienten trenger å vise eierens NAVN? Da må repositoryet hente
 * brukeren også (db.query med `with: { user: true }`), og mapperen plukker ut
 * `user.name`, men aldri `user.email`.
 */
export function toTaskDTO(task: Task): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
  };
}
