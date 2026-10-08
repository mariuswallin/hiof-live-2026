import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, test, vi } from "vitest";

import { TaskRegister } from "@/components/tasks/TaskRegister";

/**
 * KOMPONENT-TEST: render komponenten, gjør det brukeren gjør, sjekk resultatet.
 *
 * Testing Library oppfordrer til å finne ting slik brukeren ser dem
 * (tekst, placeholder, rolle) - ikke via interne detaljer som state.
 */
describe("TaskRegister", () => {
  test("viser det brukeren skriver", async () => {
    await render(<TaskRegister onRegister={() => {}} />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter task name"),
      "Handle melk",
    );

    expect(screen.getByText("Du skrev Handle melk")).toBeTruthy();
  });

  test("sender tittelen opp via onRegister når man trykker på knappen", async () => {
    // vi.fn() = en "spion": en tom funksjon som husker hvordan den ble kalt.
    const onRegister = vi.fn();
    await render(<TaskRegister onRegister={onRegister} />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter task name"),
      "Handle melk",
    );
    await fireEvent.press(screen.getByText("Register Task"));

    expect(onRegister).toHaveBeenCalledTimes(1);
    expect(onRegister).toHaveBeenCalledWith("Handle melk");
  });

  test("viser feilmelding fra forelderen", async () => {
    await render(
      <TaskRegister onRegister={() => {}} error="Tittel må ha minst 3 tegn" />,
    );

    expect(screen.getByText("Tittel må ha minst 3 tegn")).toBeTruthy();
  });
});
