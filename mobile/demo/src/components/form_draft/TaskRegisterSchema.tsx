import { useState } from "react";

import {
  FormCard,
  SubmitButton,
  TextField,
} from "@/components/form_draft/FormControls";
import { validateNewTask, type NewTask } from "@/utils_draft/task-schema";

type TaskRegisterSchemaProps = {
  onAdd: (title: string) => void;
};

/** Én feilmelding per felt. Partial = feltet kan mangle (= ingen feil). */
type FormErrors = Partial<Record<keyof NewTask, string>>;

/** Startverdiene samlet ett sted - brukes både i useState og ved reset. */
const INITIAL_VALUES: NewTask = { title: "" };

/**
 * 2) Gjenbruk av schema: state er ETT OBJEKT med samme form som NewTask.
 *
 * - values: { title } - typen kommer fra zod, så state og validering
 *           kan ikke komme i utakt. Nytt felt i skjemaet = TypeScript-feil her.
 * - errors: { title?: "..." } - bygges fra validateNewTask sine feil.
 *
 * Reglene skrives ikke her. Vi spør bare skjemaet.
 */
export function TaskRegisterSchema({ onAdd }: TaskRegisterSchemaProps) {
  const [values, setValues] = useState<NewTask>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  // Én oppdaterer for alle felt. [field] er en "computed key": nøkkelen
  // bestemmes av variabelen. Ny objekt-kopi, ellers ser React ingen endring.
  const setField = (field: keyof NewTask, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = () => {
    const result = validateNewTask(values);

    if (!result.success) {
      // [{ field: "title", message: "..." }] -> { title: "..." }
      setErrors(
        Object.fromEntries(result.errors.map((e) => [e.field, e.message])),
      );
      return;
    }

    // result.data er det zod ga tilbake - allerede trimmet.
    onAdd(result.data.title);
    setValues(INITIAL_VALUES);
    setErrors({});
  };

  return (
    <FormCard title="Ny oppgave (schema)">
      <TextField
        label="Tittel"
        placeholder="F.eks. Lese om skjema"
        value={values.title}
        onChangeText={(text) => setField("title", text)}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        error={errors.title}
      />
      <SubmitButton label="Legg til" onPress={handleSubmit} />
    </FormCard>
  );
}
