"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import type { CreateTaskInput } from "../task-validator";
import { createTask } from "../task-api";

// Her har vi en form med nødvendige inputs

// Her kan vi ha en "use client" eller ikke komponent

// Bruker use client hvis vi skal ha state, validering på input fortløpende
// Vi skal ha animasjoner, vi skal endringer på knapp som følge av noe som skjer
// Eller vi skal bruke "gammeldags" React

// Hvis vi bruker ren server actions så kan vi unngå "use client"

const initialData: CreateTaskInput = {
  title: "",
  completed: false,
  dueDate: null,
};

export function CreateTaskForm() {
  const [data, setData] = useState<CreateTaskInput>(initialData);

  const [status, setStatus] = useState<
    "loading" | "error" | "idle" | "success"
  >("idle");
  const [error, setError] = useState<null | string>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setFieldErrors({});

    // createTask fanger selv fetch-feil, så vi sjekker bare ok
    const result = await createTask(data);

    if (!result.ok) {
      setStatus("error");
      setError(result.error.message);
      setFieldErrors(result.error.fieldErrors ?? {});
      return;
    }

    setStatus("success");
    setData(initialData);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const key = event.target.name;

    setData((prev) => ({ ...prev, [key]: value }));
  };

  const isLoading = status === "loading";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex flex-col gap-3 max-w-lg mx-auto"
    >
      <label className="flex flex-col gap-1">
        <span>Tittel</span>
        <input
          name="title"
          placeholder="Skriv inn tittel"
          type="text"
          value={data.title}
          onChange={onInputChange}
          disabled={isLoading}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      {fieldErrors.title ? (
        <p className="text-sm text-red-600">{fieldErrors.title[0]}</p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isLoading ? "Lagrer..." : "Lag ny task"}
      </button>

      {status === "error" ? (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      ) : null}

      {status === "success" ? (
        <p className="text-green-700">Task opprettet</p>
      ) : null}
    </form>
  );
}
