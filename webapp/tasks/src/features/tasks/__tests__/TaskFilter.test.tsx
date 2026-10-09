// @vitest-environment happy-dom
//
// KOMPONENTTEST av filteret. Ingen server: vi sender inn `params` slik
// TasksPage ville gjort etter parseParams, og sjekker det brukeren ser og gjør.
//
// Vi trykker aldri "Filtrer". Da ville nettleseren lastet en ny side, og det
// dekker e2e-testen. Her sjekker vi hva skjemaet VILLE sendt.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskFilter } from "../components/TaskFilter";

describe("TaskFilter", () => {
  it("viser det som står i URL-en", () => {
    render(<TaskFilter params={{ q: "oblig", completed: "false" }} />);

    expect(screen.getByLabelText("Søk")).toHaveValue("oblig");
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("Ikke ferdig");
  });

  it("står på Alle når ingenting er valgt", () => {
    render(<TaskFilter params={{}} />);

    expect(screen.getByLabelText("Søk")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("Alle");
  });

  it("sender søk og status som query-parametere", async () => {
    const user = userEvent.setup();
    render(<TaskFilter params={{}} />);

    await user.type(screen.getByLabelText("Søk"), "oblig");
    await user.selectOptions(screen.getByLabelText("Status"), "Ferdig");

    // Navnene på feltene blir navnene i URL-en: /tasks?q=oblig&completed=true
    expect(screen.getByTestId("task-filter")).toHaveFormValues({
      q: "oblig",
      completed: "true",
    });
  });

  it("Nullstill går til lista uten filter", () => {
    render(<TaskFilter params={{ q: "oblig", completed: "true" }} />);

    expect(screen.getByRole("link", { name: "Nullstill" })).toHaveAttribute(
      "href",
      "/tasks",
    );
  });
});
