import type { User } from "@/db/schema";

export type Role = User["role"];

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

export const isAdmin = (user: SessionUser | null) => user?.role === "admin";
