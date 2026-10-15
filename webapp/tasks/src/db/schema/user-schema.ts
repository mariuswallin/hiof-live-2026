import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  // Rollen bor i databasen, ikke i cookien. `enum` gir typen "user" | "admin",
  // og nye brukere er vanlige brukere til noen sier noe annet.
  role: text({ enum: ["user", "admin"] }).notNull().default("user"),
});

export type User = typeof users.$inferSelect;
export type CreateUser = typeof users.$inferInsert;
