/**
 * Typene auth-featuren deler med resten av appen.
 *
 * `role` er nytt. Før sjekket vi `email.startsWith("admin@")`, som er en
 * forretningsregel gjemt i en streng. En egen rolle gjør regelen synlig, og
 * TypeScript sier fra hvis noen skriver "Admin" med stor A.
 *
 * TANKE: I en ekte app ligger rollen i databasen (users.role), ikke i en
 * cookie. Hvordan ville dere lagt den til? Migrasjon, seed, og så leser
 * setUser den derfra i stedet for å stole på det som står i sesjonen.
 */
export type Role = "user" | "admin";

export type SessionUser = {
  // Et TALL, fordi det skal matche users.id i databasen.
  id: number;
  email: string;
  name: string;
  role: Role;
};
