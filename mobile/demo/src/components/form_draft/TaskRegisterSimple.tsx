import { useState } from "react";

import {
  FormCard,
  SubmitButton,
  TextField,
} from "@/components/form_draft/FormControls";

type TaskRegisterSimpleProps = {
  /** Kalles med en gyldig, trimmet tittel. Forelderen lager selve Task-en. */
  onAdd: (title: string) => void;
};

/**
 * 1) Enkel variant: én useState per verdi, og ALT er bare string.
 *
 * - title: det som står i feltet.
 * - error: feilmeldingen. Tom streng "" betyr "ingen feil".
 *
 * Valideringen er en vanlig if. Helt greit for ett felt - men regelen
 * ("minst 3 tegn") bor nå HER og ikke i TaskSchema, så de kan komme i utakt.
 */
export function TaskRegisterSimple({ onAdd }: TaskRegisterSimpleProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleChange = (text: string) => {
    setTitle(text);
    // Fjern gammel feil så snart brukeren retter på feltet.
    if (error) setError("");
  };

  const handleSubmit = () => {
    const trimmed = title.trim();

    if (trimmed.length < 3) {
      setError("Tittel må ha minst 3 tegn");
      return;
    }

    onAdd(trimmed);
    // Nullstill skjemaet ved å sette state tilbake til startverdiene.
    setTitle("");
    setError("");
  };

  return (
    <FormCard title="Ny oppgave (enkel)">
      <TextField
        label="Tittel"
        placeholder="F.eks. Lese om skjema"
        value={title}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        error={error}
      />
      <SubmitButton label="Legg til" onPress={handleSubmit} />
    </FormCard>
  );
}
