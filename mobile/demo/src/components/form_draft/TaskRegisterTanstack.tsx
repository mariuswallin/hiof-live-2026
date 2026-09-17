import { useForm } from "@tanstack/react-form";

import {
  FormCard,
  SubmitButton,
  TextField,
} from "@/components/form_draft/FormControls";
import { NewTaskSchema, type NewTask } from "@/utils_draft/task-schema";

type TaskRegisterTanstackProps = {
  onAdd: (title: string) => void;
};

const DEFAULT_VALUES: NewTask = { title: "" };

/**
 * 3) TanStack Form: state er fortsatt ett objekt ({ title }), men nå er det
 * biblioteket som eier det - ikke useState.
 *
 * - defaultValues: startobjektet. Typen på hele skjemaet utledes herfra,
 *                  så `name="title"` er typesjekket.
 * - validators:    zod-skjemaet sendes RETT inn. TanStack Form støtter
 *                  "Standard Schema", som zod implementerer - ingen adapter.
 *                  Feilene fordeles automatisk til riktig felt.
 * - onSubmit:      kjøres bare når alt er gyldig.
 *
 * Headless: ingen egne komponenter, så det virker i React Native uten
 * oppsett. Vi kobler field.* til TextInput selv.
 * Docs: https://tanstack.com/form/latest/docs/framework/react/guides/validation
 */
export function TaskRegisterTanstack({ onAdd }: TaskRegisterTanstackProps) {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: {
      onChange: NewTaskSchema,
    },
    onSubmit: ({ value, formApi }) => {
      // Validatorene sjekker bare - de endrer ikke verdien. parse() gir oss
      // den trimmede versjonen fra samme skjema.
      onAdd(NewTaskSchema.parse(value).title);
      formApi.reset();
    },
  });

  // handleSubmit returnerer et Promise. `void` sier at vi bevisst ignorerer det.
  const submit = () => {
    void form.handleSubmit();
  };

  return (
    <FormCard title="Ny oppgave (TanStack Form)">
      <form.Field name="title">
        {(field) => (
          <TextField
            label="Tittel"
            placeholder="F.eks. Lese om skjema"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            onSubmitEditing={submit}
            returnKeyType="done"
            // Med zod er feilene objekter ({ message }), ikke strenger.
            // Vis dem først når feltet er rørt, så skjemaet ikke "roper" med en gang.
            error={
              field.state.meta.isTouched
                ? field.state.meta.errors.map((e) => e?.message).join(", ")
                : undefined
            }
          />
        )}
      </form.Field>

      {/* Subscribe = rendre bare denne biten på nytt når canSubmit endres. */}
      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <SubmitButton
            label="Legg til"
            onPress={submit}
            disabled={!canSubmit}
          />
        )}
      </form.Subscribe>
    </FormCard>
  );
}
