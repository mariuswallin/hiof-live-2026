"use client";
// Her lager vi komponenten som skal liste ut en konkret Task

import { useAuth } from "@/features/auth/components/AuthProvider";
import type { TaskDTO } from "../task-mapper";

// Den har f.eks [] for å markere fullført eller ikke
// Den har kanskje en knapp for sletting
// Den har kanskje tittel for tasken

// Den har noe styling (Tailwind eller vanlig css)
// Den har nødvendig props

export function TaskItem({ task }: { task: TaskDTO }) {
  const { isAdmin } = useAuth();

  const remove = async () => {
    // her bruker vi server action eller fetch til /api/tasks/:id for å slette tasken
  };

  return (
    <li className="rounded-md border border-slate-200 p-3 data-[pending=true]:opacity-50">
      <div className="flex items-center gap-3">
        <span className="flex-1 text-sm">{task.title}</span>
        <span>{task.completed ? "Fullført" : "Ikke fullført"}</span>
        {isAdmin && (
          <button
            type="button"
            onClick={remove}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Slett
          </button>
        )}
      </div>
    </li>
  );
}
