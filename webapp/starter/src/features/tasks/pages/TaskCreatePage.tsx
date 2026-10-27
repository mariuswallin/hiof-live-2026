// Her lager vi TaskCreatePage

import { CreateTaskForm } from "../components/CreateTaskForm";

export function TasksCreatePage() {
  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1>Her er tasks create page</h1>
      <CreateTaskForm />
    </main>
  );
}
