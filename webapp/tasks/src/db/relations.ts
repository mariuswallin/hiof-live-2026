import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    tasks: r.many.tasks({ from: r.users.id, to: r.tasks.userId }),
  },
  tasks: {
    user: r.one.users({
      from: r.tasks.userId,
      to: r.users.id,
      optional: false,
    }),
  },
}));

export type Relations = typeof relations;
