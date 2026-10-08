// @vitest-environment happy-dom
//
// ENHETSTEST av skjemaet. Ingen server og ingen database: server actionen
// byttes ut med en falsk (vi.fn) som sendes inn som prop. Det er grunnen til
// at CreateTaskForm tar `action` som prop i stedet for å importere den.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CreateTaskFormState } from "../actions";
import { CreateTaskForm } from "../components/CreateTaskForm";

// En falsk action som svarer det vi ber den om. `vi.fn` husker hvert kall,
// så vi kan sjekke hva skjemaet sendte.
const fakeAction = (response: CreateTaskFormState) =>
  vi.fn(async (_prev: CreateTaskFormState, _formData: FormData) => response);

const successResponse: CreateTaskFormState = {
  success: true,
  task: {
    id: "1",
    title: "Skrive obligen",
    completed: false,
    dueDate: null,
    createdAt: "2026-10-05T12:00:00.000Z",
  },
};

describe("CreateTaskForm", () => {
  it("sender tittelen til action som FormData", async () => {
    const user = userEvent.setup();
    const action = fakeAction(successResponse);
    render(<CreateTaskForm action={action} />);

    await user.type(screen.getByLabelText("Ny oppgave"), "Skrive obligen");
    await user.click(screen.getByRole("button", { name: "Legg til" }));

    expect(action).toHaveBeenCalledOnce();
    const formData = action.mock.calls[0][1];
    expect(formData.get("title")).toBe("Skrive obligen");
  });

  it("tømmer feltet etter at oppgaven er lagret", async () => {
    const user = userEvent.setup();
    render(<CreateTaskForm action={fakeAction(successResponse)} />);
    const input = screen.getByLabelText("Ny oppgave");

    await user.type(input, "Skrive obligen");
    await user.click(screen.getByRole("button", { name: "Legg til" }));

    // findBy venter: React nullstiller skjemaet når actionen er ferdig.
    await vi.waitFor(() => expect(input).toHaveValue(""));
  });

  it("viser feltfeilen fra serveren og beholder det brukeren skrev", async () => {
    const user = userEvent.setup();
    const action = fakeAction({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Ugyldige felter",
        fieldErrors: { title: ["Tittel kan ikke være tom"] },
      },
      values: { title: "  ", dueDate: "" },
    });
    render(<CreateTaskForm action={action} />);

    await user.type(screen.getByLabelText("Ny oppgave"), "  ");
    await user.click(screen.getByRole("button", { name: "Legg til" }));

    expect(
      await screen.findByText("Tittel kan ikke være tom"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Ny oppgave")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Ny oppgave")).toHaveValue("  ");
  });

  it("viser en generell feil når det ikke er en feltfeil", async () => {
    const user = userEvent.setup();
    const action = fakeAction({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Du må være innlogget" },
      values: { title: "Hei", dueDate: "" },
    });
    render(<CreateTaskForm action={action} />);

    await user.type(screen.getByLabelText("Ny oppgave"), "Hei");
    await user.click(screen.getByRole("button", { name: "Legg til" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Du må være innlogget",
    );
  });

  it("sender fristen med, og tom frist som tom tekst", async () => {
    const user = userEvent.setup();
    const action = fakeAction(successResponse);
    render(<CreateTaskForm action={action} />);

    await user.type(screen.getByLabelText("Ny oppgave"), "Med frist");
    await user.type(screen.getByLabelText("Frist (valgfri)"), "2030-01-15");
    await user.click(screen.getByRole("button", { name: "Legg til" }));

    const formData = action.mock.calls[0][1];
    expect(formData.get("dueDate")).toBe("2030-01-15");
  });

  it("viser fristfeilen fra serveren og beholder datoen", async () => {
    const user = userEvent.setup();
    const action = fakeAction({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Ugyldige felter",
        fieldErrors: { dueDate: ["Fristen kan ikke være før i dag"] },
      },
      values: { title: "For sent", dueDate: "2000-01-01" },
    });
    render(<CreateTaskForm action={action} />);

    await user.type(screen.getByLabelText("Ny oppgave"), "For sent");
    await user.click(screen.getByRole("button", { name: "Legg til" }));

    expect(
      await screen.findByText("Fristen kan ikke være før i dag"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Frist (valgfri)")).toHaveValue("2000-01-01");
    // Feltfeil, så ingen generell feilmelding i tillegg.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("kaller onOptimisticCreate med verdiene før serveren svarer", async () => {
    const user = userEvent.setup();
    const onOptimisticCreate = vi.fn();
    render(
      <CreateTaskForm
        action={fakeAction(successResponse)}
        onOptimisticCreate={onOptimisticCreate}
      />,
    );

    await user.type(screen.getByLabelText("Ny oppgave"), "Rask");
    await user.click(screen.getByRole("button", { name: "Legg til" }));

    expect(onOptimisticCreate).toHaveBeenCalledWith({
      title: "Rask",
      dueDate: "",
    });
  });
});
