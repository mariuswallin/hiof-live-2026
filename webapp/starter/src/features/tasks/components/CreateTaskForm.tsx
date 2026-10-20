"use client";

import { useState, type ChangeEvent } from "react";
import type { CreateTaskInput } from "../task-validator";
import { createTask } from "../task-api";

// Her har vi en form med nødvendige inputs

// Her kan vi ha en "use client" eller ikke komponent

// Bruker use client hvis vi skal ha state, validering på input fortløpende
// Vi skal ha animasjoner, vi skal endringer på knapp som følge av noe som skjer
// Eller vi skal bruke "gammeldags" React

// Hvis vi bruker ren server actions så kan vi unngå "use client"

export function CreateTaskForm() {
  const [data, setData] = useState<CreateTaskInput>({
    title: "",
    completed: false,
    dueDate: null,
  });

  const [status, setStatus] = useState<
    "loading" | "error" | "idle" | "success"
  >("loading");
  const [error, setError] = useState<null | string>(null);

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    setStatus("loading");

    try {
      await createTask(data);
      setStatus("success");
    } catch (error) {
      setError("En eller annen feilmelding");
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const key = event.target.name;

    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        name="title"
        placeholder="Skriv inn tittel"
        type="text"
        onChange={onInputChange}
      />
      <button type="submit">Lag ny task</button>
    </form>
  );
}
