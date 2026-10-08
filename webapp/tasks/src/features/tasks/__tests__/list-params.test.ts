// ENHETSTEST av de to små verktøyene lista bruker. Rene funksjoner: ingen
// database, ingen server. En Request lager vi selv, den finnes i Node.
//
//   parseParams         URL   -> tekst      utils/parse-params.ts
//   validateListParams  tekst -> typer      utils/validate-list-params.ts
import { describe, expect, it } from "vitest";
import { parseParams } from "../utils/parse-params";
import { validateListParams } from "../utils/validate-list-params";

describe("parseParams", () => {
  it("gjør query-strengen om til et objekt med tekst", () => {
    const request = new Request("http://localhost/tasks?completed=false&q=%C3%B8l");

    // Fortsatt tekst: "false", ikke false. æøå er kodet tilbake.
    expect(parseParams(request)).toEqual({ completed: "false", q: "øl" });
  });
});

describe("validateListParams", () => {
  it("gjør tekst om til riktige typer", () => {
    expect(
      validateListParams({ completed: "false", q: "  oblig ", limit: "5" }),
    ).toEqual({ ok: true, params: { completed: false, q: "oblig", limit: 5 } });
  });

  it("tomme verdier betyr ikke satt", () => {
    // Det et GET-skjema sender når feltene står tomme.
    expect(validateListParams({ completed: "", q: "", limit: "" })).toEqual({
      ok: true,
      params: {},
    });
  });

  it("avviser verdier som ikke kan bli riktig type", () => {
    expect(validateListParams({ completed: "kanskje" })).toMatchObject({
      ok: false,
      field: "completed",
    });
    expect(validateListParams({ limit: "ti" })).toMatchObject({
      ok: false,
      field: "limit",
    });
  });
});
