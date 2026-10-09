"use client";

import { useActionState } from "react";
import type { CreateTaskFormAction, CreateTaskFormState } from "../actions";

type CreateTaskFormProps = {
  action: CreateTaskFormAction;
};

export function CreateTaskForm({ action }: CreateTaskFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: CreateTaskFormState, formData: FormData) => {
      return action(prevState, formData);
    },
    null,
  );

  const failed = state?.ok === false ? state : null;
  const titleError = failed?.error.fieldErrors?.title?.[0];
  const dueDateError = failed?.error.fieldErrors?.dueDate?.[0];
  const hasFieldErrors = titleError ?? dueDateError;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-2">
      <label htmlFor="title" className="text-sm font-medium">
        Ny oppgave
      </label>
      <div className="flex gap-2">
        <input
          id="title"
          name="title"
          defaultValue={failed?.values.title ?? ""}
          placeholder="Hva skal gjøres?"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={failed?.values.dueDate ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Lagrer..." : "Legg til"}
        </button>
      </div>
      {titleError && (
        <p id="title-error" className="text-sm text-red-600">
          {titleError}
        </p>
      )}
      {dueDateError && (
        <p id="dueDate-error" className="text-sm text-red-600">
          {dueDateError}
        </p>
      )}
      {failed && !hasFieldErrors && (
        <p role="alert" className="text-sm text-red-600">
          {failed.error.message}
        </p>
      )}
    </form>
  );
}
