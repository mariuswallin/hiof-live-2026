// Her inne lager vi funksjoner som brukes i komponenter for å kalle
// Vårt api eller eksternt api

// Bruker ex. fetch, axios e.l

// Håndterer feil som kan oppstå med fetch og har en konsistent måte å gjøre dette på

import type { TaskDTO } from "./task-mapper";

// Samme format som controlleren sender tilbake
export type CreateTaskResult =
  | {
      ok: true;
      data: TaskDTO;
    }
  | {
      ok: false;
      error: {
        code?: number;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export async function createTask(data: unknown): Promise<CreateTaskResult> {
  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return (await res.json()) as CreateTaskResult;
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error: {
        message: "Feil ved henting av data",
      },
    };
  }
}
