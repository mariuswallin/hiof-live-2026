import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  // Rollen bor i databasen, ikke i cookien. Da er det serveren som bestemmer
  // hvem som er admin.
  role: text({ enum: ["admin", "user"] })
    .notNull()
    .default("user"),
});

export type User = typeof users.$inferSelect;
export type CreateUser = typeof users.$inferInsert;
