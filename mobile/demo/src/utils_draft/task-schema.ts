import { z } from "zod";

/**
 * Ett skjema = én sannhet om hva en Task ER.
 *
 * Hvorfor zod: TypeScript-typer forsvinner når koden kjører. Data utenfra
 * (API, skjema, AsyncStorage) er `unknown` i praksis. Zod validerer i runtime
 * OG gir oss typen gratis via z.infer.
 */
export const TaskSchema = z.object({
  id: z.string().min(1, "id kan ikke være tom"),
  // trim() først, så "   " ikke teller som tre tegn.
  title: z.string().trim().min(3, "Tittel må ha minst 3 tegn"),
  done: z.boolean(),
});

/** Typen utledes fra skjemaet - vi skriver den aldri to ganger. */
export type Task = z.infer<typeof TaskSchema>;

/**
 * Det brukeren fyller ut i et skjema. id og done lager appen selv, så vi
 * PLUKKER bare feltene vi trenger fra TaskSchema i stedet for å skrive
 * reglene på nytt. Endres regelen for title, gjelder den begge steder.
 */
export const NewTaskSchema = TaskSchema.pick({ title: true });

export type NewTask = z.infer<typeof NewTaskSchema>;

/** Én feil, knyttet til ett felt. */
export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Strukturert resultat i stedet for å kaste exception.
 * Discriminated union: sjekker du `success`, vet TypeScript hva som finnes.
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Validerer ukjent data mot TaskSchema.
 *
 * @param input - hva som helst (typisk JSON fra et API eller et skjema)
 * @returns { success: true, data } eller { success: false, errors }
 */
export function validateTask(input: unknown): ValidationResult<Task> {
  const result = TaskSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: toValidationErrors(result.error) };
}

/** Samme, men for en hel liste. Nyttig når vi henter data fra et API. */
export function validateTasks(input: unknown): ValidationResult<Task[]> {
  const result = z.array(TaskSchema).safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // path blir f.eks. "2.title" = feil i tittel på element nr. 2
  return { success: false, errors: toValidationErrors(result.error) };
}

/** Validerer det brukeren har fylt ut i "ny oppgave"-skjemaet. */
export function validateNewTask(input: unknown): ValidationResult<NewTask> {
  const result = NewTaskSchema.safeParse(input);

  if (result.success) {
    // data er ferdig trimmet - skjemaet både sjekker OG rydder.
    return { success: true, data: result.data };
  }

  return { success: false, errors: toValidationErrors(result.error) };
}

/**
 * issues er zod sin råform. Vi mapper den til vår egen enkle form,
 * slik at resten av appen slipper å kjenne til zod.
 */
function toValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(rot)",
    message: issue.message,
  }));
}
