// Her inne lager vi funksjoner som brukes i komponenter for å kalle
// Vårt api eller eksternt api

// Bruker ex. fetch, axios e.l

// Håndterer feil som kan oppstå med fetch og har en konsistent måte å gjøre dette på

export async function createTask(data: unknown) {
  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
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
