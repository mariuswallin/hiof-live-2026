// Enhetstest av ren auth-logikk. Ingen rwsdk, ingen server: bare funksjoner
// inn og ut.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionCookie,
  createSessionCookie,
  readCookie,
  readSessionUserId,
} from "../session";

/** En forespørsel med akkurat den Cookie-headeren testen vil sende. */
const requestWith = (cookie?: string) =>
  new Request("http://localhost/", { headers: cookie ? { cookie } : {} });

/** "session=verdi; HttpOnly; ..." -> "session=verdi", slik nettleseren sender. */
const asCookieHeader = (setCookie: string) => setCookie.split(";")[0];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSessionCookie", () => {
  it("setter attributtene som beskytter cookien", () => {
    const cookie = createSessionCookie(2);

    expect(cookie).toMatch(/^session=2; /);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=3600");
    expect(cookie).toContain("Secure");
  });

  it("dropper Secure lokalt, der vi kjører uten HTTPS", () => {
    vi.stubEnv("VITE_IS_DEV_SERVER", "1");

    expect(createSessionCookie(2)).not.toContain("Secure");
  });
});

describe("clearSessionCookie", () => {
  it("sletter cookien med Max-Age=0", () => {
    vi.stubEnv("VITE_IS_DEV_SERVER", "1");

    expect(clearSessionCookie()).toBe(
      "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    );
  });
});

describe("readSessionUserId", () => {
  it("er ikke innlogget uten cookie", () => {
    expect(readSessionUserId(requestWith())).toBeNull();
  });

  it("leser id-en fra cookien serveren satte", () => {
    const cookie = createSessionCookie(2);

    expect(readSessionUserId(requestWith(asCookieHeader(cookie)))).toBe(2);
  });

  it("avviser alt som ikke er et positivt heltall", () => {
    for (const value of ["abc", "-1", "0", "1.5", "2 OR 1=1", ""]) {
      expect(readSessionUserId(requestWith(`session=${value}`))).toBeNull();
    }
  });
});

describe("readCookie", () => {
  it("finner riktig cookie blant flere", () => {
    expect(readCookie("annet=1; session=abc; mer=2", "session")).toBe("abc");
  });

  it("dekoder verdien", () => {
    expect(readCookie("session=a%20b", "session")).toBe("a b");
  });

  it("gir undefined når cookien mangler eller er ugyldig kodet", () => {
    expect(readCookie(null, "session")).toBeUndefined();
    expect(readCookie("annet=1", "session")).toBeUndefined();
    expect(readCookie("session=%E0%A4%A", "session")).toBeUndefined();
  });
});
