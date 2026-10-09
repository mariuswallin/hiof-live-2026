// Brukes for å lage en abstraksjon rundt fetch eller axios for å kommunisere med REST-apiet eller
// eksterne tjenester

import type { TaskDTO } from "./task-mapper";

type ResultError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

type CreateTaskResult =
  | { ok: true; data: TaskDTO }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors: Record<string, string[]>;
      };
    };

export async function listTasks(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params ?? {}).toString();
  try {
    const response = await fetch(`/api/v1/tasks?${query}`);

    if (!response.ok) {
      console.log(response.ok, response.status, response.statusText);
      throw new Error("Response not ok");
    }

    const data = await response.json();
    // TODO: `as` sier bare til TypeScript hvilken form svaret har, uten å sjekke det.
    // Svaret kommer utenfra og bør valideres med Zod og safeParse
    return data as { ok: true; data: TaskDTO[] };
  } catch (error) {
    console.log(error);

    return {
      ok: false,
      error: {
        code: "500",
        message:
          "Fikk ikke kontakt med serveren eller noe er feil med spørringen",
      },
    } as { ok: boolean; error: ResultError };
  }
}

// await createTask({ id: 1, title: "test" });

export async function createTask(data: {
  title: string;
  dueDate?: string;
}): Promise<CreateTaskResult> {
  try {
    const response = await fetch("/api/v1/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    // API-et svarer { ok, data } ved 201 og { ok: false, error } ved 400/500.
    // TODO: Samme som i listTasks: `as` sjekker ingenting. Valider svaret med Zod
    return (await response.json()) as CreateTaskResult;
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      error: {
        code: "500",
        message: "Fikk ikke kontakt med serveren",
        fieldErrors: {},
      },
    };
  }
}

export async function removeTask(id: string) {
  try {
    const response = await fetch(`/api/v1/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    console.log(response.ok, response.status, response.statusText);

    if (response.ok) {
      return {
        ok: true,
        data: {
          id,
        },
      };
    }

    const body = (await response.json()) as { error: ResultError };

    return {
      ok: false,
      error: body.error,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error: {
        code: "500",
        message:
          "Fikk ikke kontakt med serveren eller noe er feil med spørringen",
      },
    } as { ok: boolean; error: ResultError };
  }
}
