// ENHETSTEST av forretningsregelen. Ren funksjon: ingen database, ingen Zod,
// ingen server. Hele fila kjører på millisekunder.
//
// Skrevet med TDD, i tre runder. Hver runde starter med en test som er RØD,
// så kommer minst mulig kode for GRØNN, så rydding. Rekkefølgen her er
// rekkefølgen testene ble skrevet i.
import { describe, expect, it } from "vitest";
import { TITLE_MAX_LENGTH, validateTask } from "../validate-task";

// "I dag" er låst, så testene gir samme svar hver dag.
const now = new Date("2026-10-06T09:00:00.000Z");

describe("validateTask", () => {
  // RUNDE 1. Rød fordi validateTask ikke finnes ennå. Grønn med
  // `return { ok: true }`, og det er nok. Ingen regel er krevd ennå.
  it("godtar en vanlig oppgave", () => {
    expect(validateTask({ title: "Skrive obligen" }, now)).toEqual({ ok: true });
  });

  // RUNDE 2. Tittelen. Første test er rød fordi runde 1 godtar alt.
  it("avviser tom tittel", () => {
    expect(validateTask({ title: "" }, now)).toEqual({
      ok: false,
      field: "title",
      error: "Tittel kan ikke være tom",
    });
  });

  it("avviser tittel med bare mellomrom", () => {
    expect(validateTask({ title: "   " }, now)).toMatchObject({
      ok: false,
      field: "title",
    });
  });

  it(`godtar tittel på nøyaktig ${TITLE_MAX_LENGTH} tegn`, () => {
    const title = "a".repeat(TITLE_MAX_LENGTH);
    expect(validateTask({ title }, now)).toEqual({ ok: true });
  });

  it(`avviser tittel over ${TITLE_MAX_LENGTH} tegn`, () => {
    const title = "a".repeat(TITLE_MAX_LENGTH + 1);
    expect(validateTask({ title }, now)).toMatchObject({
      ok: false,
      field: "title",
    });
  });

  // RUNDE 3. Fristen. Grensa er starten av dagen, ikke klokkeslettet nå.
  it("avviser frist i går", () => {
    const dueDate = new Date("2026-10-05T00:00:00.000Z");
    expect(validateTask({ title: "Sent ute", dueDate }, now)).toEqual({
      ok: false,
      field: "dueDate",
      error: "Fristen kan ikke være før i dag",
    });
  });

  it("godtar frist i dag, selv om klokka har passert midnatt", () => {
    const dueDate = new Date("2026-10-06T00:00:00.000Z");
    expect(validateTask({ title: "I dag", dueDate }, now)).toEqual({
      ok: true,
    });
  });

  it("godtar oppgave uten frist", () => {
    expect(validateTask({ title: "Når som helst", dueDate: null }, now)).toEqual(
      { ok: true },
    );
  });

  // Update sender bare det som endres. Mangler feltet, sjekkes det ikke.
  it("sjekker bare feltene som er med", () => {
    expect(validateTask({}, now)).toEqual({ ok: true });
  });
});
