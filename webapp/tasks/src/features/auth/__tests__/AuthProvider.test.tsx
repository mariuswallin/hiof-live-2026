// @vitest-environment happy-dom
//
// Komponenttest av context. I appen er det AppLayout som gir <AuthProvider> en
// bruker. Her gjør testen det, og en liten prøvekomponent leser den tilbake.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SessionUser } from "../auth-types";
import { AuthProvider, useAuth } from "../components/AuthProvider";
import { toSessionUser } from "../demo-users";

/** Gjør det en ekte komponent ville gjort: spør useAuth(), og tegner svaret. */
function Probe() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  return (
    <p>
      {user?.name ?? "ingen"} / innlogget: {String(isAuthenticated)} / admin:{" "}
      {String(isAdmin)}
    </p>
  );
}

const renderWith = (user: SessionUser | null) =>
  render(
    <AuthProvider user={user}>
      <Probe />
    </AuthProvider>,
  );

describe("useAuth", () => {
  it("er ikke innlogget når serveren sendte null", () => {
    renderWith(null);

    expect(
      screen.getByText("ingen / innlogget: false / admin: false"),
    ).toBeInTheDocument();
  });

  it("gir en vanlig bruker, som ikke er admin", () => {
    renderWith(toSessionUser("ola", "user"));

    expect(
      screen.getByText("Ola Hansen / innlogget: true / admin: false"),
    ).toBeInTheDocument();
  });

  it("gir admin når rollen er admin", () => {
    renderWith(toSessionUser("kari", "admin"));

    expect(
      screen.getByText("Kari Nordmann / innlogget: true / admin: true"),
    ).toBeInTheDocument();
  });

  it("kaster utenfor <AuthProvider>, så en glemt provider oppdages med en gang", () => {
    // React logger feilen før den kastes videre. Demper støyen i testutskriften.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(
      "useAuth må brukes inne i <AuthProvider>",
    );

    consoleError.mockRestore();
  });
});
