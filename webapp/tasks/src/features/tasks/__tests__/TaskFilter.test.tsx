// @vitest-environment happy-dom
//
// KOMPONENTTEST av filteret. Ingen server: vi sender inn `params` slik
// TasksPage ville gjort etter parseParams, og sjekker at feltene viser dem.
//
// Selve innsendingen tester vi ikke her. Det er nettleseren som gjør feltene
// om til ?q=...&completed=..., ikke vår kode. Det dekker e2e-testen.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskFilter } from "../components/TaskFilter";

describe("TaskFilter", () => {
  it("viser det som står i URL-en", () => {
    render(<TaskFilter params={{ q: "oblig", completed: "false" }} />);

    expect(screen.getByLabelText("Søk")).toHaveValue("oblig");
    expect(screen.getByLabelText("Status")).toHaveValue("false");
  });

  it("står på Alle når ingenting er valgt", () => {
    render(<TaskFilter params={{}} />);

    expect(screen.getByLabelText("Søk")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("Alle");
  });
});
