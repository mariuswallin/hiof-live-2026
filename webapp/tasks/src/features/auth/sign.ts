/**
 * SIGNERING av en verdi med HMAC-SHA256.
 *
 * Problemet: en cookie ligger hos KLIENTEN. `HttpOnly` stopper JavaScript i
 * nettleseren fra å lese den, men ingenting stopper noen fra å sende en
 * hjemmelaget cookie med curl:
 *
 *   curl localhost:5173/api/me -H "Cookie: session=kari:admin"
 *
 * Løsningen: serveren regner ut en signatur av verdien med en hemmelighet bare
 * den kjenner, og henger den på:
 *
 *   kari:admin.9f2c…e1     verdi + "." + signatur
 *
 * Endrer noen verdien, stemmer ikke signaturen lenger. Og uten hemmeligheten
 * kan de ikke regne ut en ny.
 *
 * Merk hva dette IKKE er: det er ikke kryptering. Verdien står i klartekst, og
 * alle kan lese den. Signaturen hindrer bare at den ENDRES.
 *
 * Web Crypto (`crypto.subtle`) finnes både i workerd, i nettleseren og i Node,
 * så dette er rene funksjoner som kan testes med Vitest.
 */
const encoder = new TextEncoder();

/** 32 bytes som 64 hex-tegn. */
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/;

async function importKey(secret: string) {
  // Uten denne ville en manglende hemmelighet blitt til teksten "undefined",
  // og alle som vet det, kunne signert sine egne cookies.
  if (!secret) {
    throw new Error(
      "SESSION_SECRET mangler. Kopier .dev.vars.example til .dev.vars.",
    );
  }

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));

/** "kari:admin" -> "kari:admin.<signatur>" */
export async function sign(value: string, secret: string) {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return `${value}.${toHex(signature)}`;
}

/**
 * "kari:admin.<signatur>" -> "kari:admin", eller `null` hvis signaturen ikke
 * stemmer. `null` betyr "stol ikke på denne", uansett hvorfor.
 */
export async function unsign(signed: string, secret: string) {
  const index = signed.lastIndexOf(".");
  if (index === -1) return null;

  const value = signed.slice(0, index);
  const signature = signed.slice(index + 1);
  if (!SIGNATURE_PATTERN.test(signature)) return null;

  // `verify` sammenligner i konstant tid. En vanlig `===` svarer raskere jo
  // tidligere tegnene er ulike, og den forskjellen kan måles utenfra.
  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromHex(signature),
    encoder.encode(value),
  );

  return valid ? value : null;
}
