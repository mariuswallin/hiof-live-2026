import { describe, expect, test } from "vitest";

import { NewTaskSchema } from "@/utils/task-schema";

/**
 * UTIL-TEST: ren logikk, ingen skjerm.
 *
 * Den enkleste typen test: kall en funksjon med input, sjekk output.
 * Her tester vi reglene for tittel i NewTaskSchema (brukt av "ny oppgave").
 */
describe("NewTaskSchema", () => {
  test("godtar en gyldig tittel", () => {
    const result = NewTaskSchema.safeParse({ title: "Lære navigasjon" });

    expect(result.success).toBe(true);
  });

  test("trimmer mellomrom rundt tittelen", () => {
    // parse() kaster ved feil - greit i en test der vi forventer suksess.
    const task = NewTaskSchema.parse({ title: "   Lese om tabs   " });

    expect(task.title).toBe("Lese om tabs");
  });

  test("avviser for kort tittel med norsk feilmelding", () => {
    const result = NewTaskSchema.safeParse({ title: "ab" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Tittel må ha minst 3 tegn");
  });

  test("teller ikke mellomrom som tegn", () => {
    // "   ab   " er 8 tegn, men bare 2 etter trim().
    const result = NewTaskSchema.safeParse({ title: "   ab   " });

    expect(result.success).toBe(false);
  });
});
