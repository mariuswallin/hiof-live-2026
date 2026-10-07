import { requestInfo } from "rwsdk/worker";
import { parseParams, type Params } from "../utils/parse-params";
import { service } from "../task-service";
import { demoDelay } from "@/lib/demo-chaos";
import { TaskList } from "../components/TaskList";
import { Suspense } from "react";

export async function TasksPage() {
  const { ctx, request } = requestInfo;

  const params = parseParams(request);

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-bold">Oppgaver</h1>
      <Suspense fallback={<TaskListSkeleton />}>
        <Tasks params={params} />
      </Suspense>
      <a className="mt-10 inline-block text-sm underline" href="/">
        Til forsiden
      </a>
    </main>
  );
}

async function Tasks({ params }: { params: Params }) {
  const { ctx, request } = requestInfo;
  await demoDelay(request, 1000);

  const result = await service.list(params);

  if (!result.ok) {
    const details = Object.values(result.error.fieldErrors ?? {}).flat();
    // {"completed": ["feil", "feil 2"], "q": [feil3, feil4]}
    // [["feil", "feil 2"], [feil3, feil4]]
    // ["feil", "feil 2", "feil 3", "feil 4"]
    return (
      <p>
        Klarte ikke å hente oppgavene: {result.error.message}{" "}
        {details.join(" ")}
      </p>
    );
  }

  return <TaskList tasks={result.data} />;
}

function TaskListSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" data-testid="task-skeleton">
      <div className="mt-6 h-4 w-24 rounded bg-slate-200" />
      <div className="mt-2 h-10 rounded-md bg-slate-200" />
      <ul className="mt-6 space-y-2">
        {[1, 2, 3].map((n) => (
          <li key={n} className="h-12 rounded-md bg-slate-100" />
        ))}
      </ul>
    </div>
  );
}
