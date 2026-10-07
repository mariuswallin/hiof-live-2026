// Brukes for å lage en abstraksjon rundt fetch eller axios for å kommunisere med REST-apiet eller
// eksterne tjenester

import type { TaskDTO } from "./task-mapper";

export async function listTasks(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params ?? {}).toString();
  try {
    const response = await fetch(`/api/v1/tasks?${query}`);

    if (!response.ok) {
      console.log(response.ok, response.status, response.statusText);
      throw new Error("Response not ok");
    }

    const data = await response.json();
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
    } as {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };
  }
}

export async function createTask(data: {
  title: string;
  dueDate?: string;
}): Promise<TaskDTO | null> {
  try {
    const response = await fetch("/api/v1/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return (await response.json()) as TaskDTO;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// await createTask({ id: 1, title: "test" });
