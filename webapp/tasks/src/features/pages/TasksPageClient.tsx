"use client";

import { useEffect, useState } from "react";
import { listTasks } from "../task-api";
import { TaskDTO } from "../task-mapper";

export function TasksPageClient() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    listTasks()
      .then((result) => {
        if (result.ok) {
          setTasks(result.data);
          return;
        }
        setError(result.error.message);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      });
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-bold">Tasks Page</h1>
      <section className="text-lg">
        {loading ? "Laster ..." : JSON.stringify(tasks, null, 2)}
      </section>
    </main>
  );
}
