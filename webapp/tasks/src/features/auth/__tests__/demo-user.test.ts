// Enhetstest av ren auth-logikk. Ingen rwsdk, ingen server: bare funksjoner
// inn og ut. Det er gevinsten av å flytte logikken ut av worker.tsx.
import { describe, expect, it } from "vitest";
import { getDemoUserFromRequest, readCookie } from "../demo-user";
import { isAdmin } from "../middleware";

const request = (headers: Record<string, string>) =>
  new Request("http://localhost/", { headers });

describe("getDemoUserFromRequest", () => {
  it("er ikke innlogget uten header og cookie", () => {
    expect(getDemoUserFromRequest(request({}))).toBeNull();
  });

  it("leser rollen fra headeren", () => {
    const user = getDemoUserFromRequest(request({ "x-demo-user": "admin" }));
    expect(user?.role).toBe("admin");
  });

  it("leser rollen fra cookien", () => {
    const user = getDemoUserFromRequest(
      request({ cookie: "annet=1; demo-user=admin" }),
    );
    expect(isAdmin(user)).toBe(true);
  });

  it("lar headeren vinne over cookien", () => {
    const user = getDemoUserFromRequest(
      request({ "x-demo-user": "bruker", cookie: "demo-user=admin" }),
    );
    expect(isAdmin(user)).toBe(false);
  });

  it("gjør ukjente verdier til vanlig bruker", () => {
    const user = getDemoUserFromRequest(request({ cookie: "demo-user=tull" }));
    expect(user?.role).toBe("user");
  });
});

describe("readCookie", () => {
  it("dekoder verdien", () => {
    expect(readCookie("demo-user=a%20b", "demo-user")).toBe("a b");
  });
});
