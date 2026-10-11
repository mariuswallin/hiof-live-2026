// Enhetstest av ren auth-logikk. Ingen rwsdk, ingen server: bare funksjoner
// inn og ut. Hemmeligheten sendes inn som argument, så testen bestemmer den.
import { describe, expect, it } from "vitest";
import {
  clearSessionCookie,
  createSessionCookie,
  readCookie,
  readSession,
} from "../session";
import { sign, unsign } from "../sign";

const secret = "test-hemmelighet";

/** En forespørsel med akkurat den Cookie-headeren testen vil sende. */
const requestWith = (cookie?: string) =>
  new Request("http://localhost/", { headers: cookie ? { cookie } : {} });

/** "session=verdi; HttpOnly; ..." -> "session=verdi", slik nettleseren sender. */
const asCookieHeader = (setCookie: string) => setCookie.split(";")[0];

describe("sign / unsign", () => {
  it("gir verdien tilbake når signaturen stemmer", async () => {
    const signed = await sign("kari:admin", secret);

    expect(signed).toMatch(/^kari:admin\.[0-9a-f]{64}$/);
    expect(await unsign(signed, secret)).toBe("kari:admin");
  });

  it("avviser en verdi som er endret etter signering", async () => {
    const signed = await sign("kari:user", secret);

    // Angrepet: behold signaturen, bytt rollen.
    const tampered = signed.replace("kari:user", "kari:admin");

    expect(await unsign(tampered, secret)).toBeNull();
  });

  it("avviser en verdi signert med en annen hemmelighet", async () => {
    const signed = await sign("kari:admin", "angriperens-gjetning");

    expect(await unsign(signed, secret)).toBeNull();
  });

  it("avviser en verdi uten signatur", async () => {
    expect(await unsign("kari:admin", secret)).toBeNull();
    expect(await unsign("kari:admin.ikkehex", secret)).toBeNull();
  });

  it("nekter å signere uten hemmelighet", async () => {
    await expect(sign("kari:admin", "")).rejects.toThrow("SESSION_SECRET");
  });
});

describe("createSessionCookie", () => {
  it("setter attributtene som beskytter cookien", async () => {
    const cookie = await createSessionCookie(
      { user: "kari", role: "admin" },
      { secret, secure: true },
    );

    expect(cookie).toMatch(/^session=kari:admin\.[0-9a-f]{64}; /);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=3600");
    expect(cookie).toContain("Secure");
  });

  it("dropper Secure lokalt, der vi kjører uten HTTPS", async () => {
    const cookie = await createSessionCookie(
      { user: "kari", role: "user" },
      { secret, secure: false },
    );

    expect(cookie).not.toContain("Secure");
  });
});

describe("clearSessionCookie", () => {
  it("sletter cookien med Max-Age=0", () => {
    expect(clearSessionCookie({ secure: false })).toBe(
      "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    );
  });
});

describe("readSession", () => {
  it("er ikke innlogget uten cookie", async () => {
    expect(await readSession(requestWith(), secret)).toBeNull();
  });

  it("leser brukeren og rollen fra cookien serveren satte", async () => {
    const cookie = await createSessionCookie(
      { user: "ola", role: "admin" },
      { secret, secure: false },
    );

    const user = await readSession(requestWith(asCookieHeader(cookie)), secret);

    expect(user).toEqual({
      id: 2,
      name: "Ola Hansen",
      email: "ola@example.com",
      role: "admin",
    });
  });

  it("stoler ikke på en cookie klienten har skrevet selv", async () => {
    const user = await readSession(requestWith("session=kari:admin"), secret);

    expect(user).toBeNull();
  });

  it("avviser ukjent bruker og ukjent rolle, selv med gyldig signatur", async () => {
    // Signaturen beviser bare at SERVEREN laget verdien. Innholdet må
    // fortsatt sjekkes.
    const unknownUser = await sign("root:admin", secret);
    const unknownRole = await sign("kari:superadmin", secret);

    expect(await readSession(requestWith(`session=${unknownUser}`), secret)).toBeNull();
    expect(await readSession(requestWith(`session=${unknownRole}`), secret)).toBeNull();
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
