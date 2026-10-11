// Enhetstest av vaktene. En vakt er bare en funksjon: ctx inn, og enten
// ingenting (slipp forbi) eller en Response (stopp her) ut. Derfor trenger vi
// verken server eller ruter for å teste dem.
import { describe, expect, it } from "vitest";
import type { RequestInfo } from "rwsdk/worker";
import type { SessionUser } from "../auth-types";
import { toSessionUser } from "../demo-users";
import { requireAdmin, requireUser, requireUserPage } from "../middleware";

const admin = toSessionUser("kari", "admin");
const bruker = toSessionUser("ola", "user");

/**
 * Bare det vaktene leser: ctx.user. `as` er greit i en test, der VI lager
 * verdien. I appen kommer RequestInfo fra rwsdk.
 */
const requestInfo = (user: SessionUser | null) =>
  ({ ctx: { user } }) as unknown as RequestInfo;

describe("requireUser", () => {
  it("slipper en innlogget bruker forbi ved å returnere ingenting", async () => {
    expect(await requireUser(requestInfo(bruker))).toBeUndefined();
  });

  it("svarer 401 når ingen er innlogget", async () => {
    const response = await requireUser(requestInfo(null));

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
  });
});

describe("requireAdmin", () => {
  it("slipper admin forbi", async () => {
    expect(await requireAdmin(requestInfo(admin))).toBeUndefined();
  });

  it("svarer 401 når ingen er innlogget: vi vet ikke hvem du er", async () => {
    const response = await requireAdmin(requestInfo(null));

    expect((response as Response).status).toBe(401);
  });

  it("svarer 403 for vanlig bruker: vi VET hvem du er", async () => {
    const response = await requireAdmin(requestInfo(bruker));

    expect((response as Response).status).toBe(403);
    expect(await (response as Response).json()).toMatchObject({
      success: false,
      error: { code: "FORBIDDEN" },
    });
  });
});

describe("requireUserPage", () => {
  it("slipper en innlogget bruker forbi", async () => {
    expect(await requireUserPage(requestInfo(bruker))).toBeUndefined();
  });

  it("sender uinnloggede til /login i stedet for å svare med JSON", async () => {
    const response = await requireUserPage(requestInfo(null));

    expect((response as Response).status).toBe(302);
    expect((response as Response).headers.get("Location")).toBe("/login");
  });
});
