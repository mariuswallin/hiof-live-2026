"use client";

import { useActionState } from "react";
import type { CreateTaskFormState } from "../actions";

type CreateTaskAction = (
  prevState: CreateTaskFormState,
  formData: FormData,
) => Promise<CreateTaskFormState>;

/**
 * Skjema for å lage en oppgave, med server action og useActionState.
 *
 * `action` kommer inn som PROP i stedet for å importeres her. Det er
 * dependency injection i React: i appen sender TaskList inn den ekte
 * server actionen, i testen sender vi inn en falsk (vi.fn). Da kan skjemaet
 * testes uten server. Se __tests__/CreateTaskForm.test.tsx.
 *
 * `onOptimisticCreate` lar TaskList vise oppgaven MED EN GANG, før serveren
 * har svart. Se useOptimistic i TaskList.tsx.
 *
 * useActionState gir tre ting:
 *   state       det action returnerte sist (null før første innsending)
 *   formAction  sendes til <form action>. React kjører den i en transition
 *   isPending   true mens action jobber
 *
 * Skjemaet er UKONTROLLERT (defaultValue, ikke value + useState). React 19
 * nullstiller skjemaet selv etter en vellykket action.
 */
export function CreateTaskForm({
  action,
  onOptimisticCreate,
}: {
  action: CreateTaskAction;
  onOptimisticCreate?: (title: string) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: CreateTaskFormState, formData: FormData) => {
      // Vi er inne i en transition her, så det er lov å oppdatere optimistisk.
      onOptimisticCreate?.(String(formData.get("title") ?? ""));
      return action(prevState, formData);
    },
    null,
  );

  // `state?.success === false` snevrer typen, så `failed.values` finnes.
  const failed = state?.success === false ? state : null;
  const titleError = failed?.error.fieldErrors?.title?.[0];

  return (
    <form
      action={formAction}
      aria-busy={isPending}
      className="mt-6 flex flex-col gap-2"
    >
      <label htmlFor="title" className="text-sm font-medium">
        Ny oppgave
      </label>

      <div className="flex gap-2">
        <input
          id="title"
          name="title"
          // React 19 nullstiller skjemaet etter hver action. Ved feil gir vi
          // brukeren tilbake det hen skrev, via defaultValue fra serveren.
          defaultValue={failed?.values.title ?? ""}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? "title-error" : undefined}
          placeholder="Hva skal gjøres?"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Lagrer…" : "Legg til"}
        </button>
      </div>

      {/*
        Med vilje INGEN `required` på feltet. Da stopper nettleseren tomme
        innsendinger før de når serveren, og vi får aldri sett at valideringen
        i servicen virker. TANKE: Legg den til etterpå. Klientvalidering er
        for brukeren, servervalidering er for sikkerheten. Vi trenger begge.
      */}
      {titleError && (
        <p id="title-error" className="text-sm text-red-600">
          {titleError}
        </p>
      )}
      {failed && !titleError && (
        <p role="alert" className="text-sm text-red-600">
          {failed.error.message}
        </p>
      )}
    </form>
  );
}
