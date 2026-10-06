import { Suspense } from "react";
import { requestInfo } from "rwsdk/worker";
import { demoDelay } from "@/lib/demo-chaos";
import { DemoUserPanel } from "@/features/auth/components/DemoUserPanel";
import { taskService } from "../task-service";
import { TaskList } from "../components/TaskList";

/**
 * /tasks. En server-komponent (RSC).
 *
 * Den spør SERVICEN direkte. Ingen fetch, ingen /api/tasks, ingen
 * loading-state: kallet kjører på serveren mens HTML-en lages.
 *
 * Merk at siden IKKE går via controlleren. Controlleren er for HTTP. En
 * server-komponent er allerede på serveren, og hopper rett til servicen.
 *
 *   server-komponent  ->  service  ->  repository  ->  D1
 *   API (fetch/curl)  ->  controller  ->  service  ->  ...
 *
 * Det interaktive ligger i TaskList, som er en klient-komponent. Grensen går
 * akkurat der: server henter, klient klikker.
 *
 * Selve hentingen ligger i <Tasks> under, inne i <Suspense>. Da sendes
 * overskriften og panelet til nettleseren MED EN GANG, med skjelettet der
 * lista skal stå. Når <Tasks> er ferdig, strømmes lista inn i samme svar.
 */
export function TasksPage() {
  const { ctx } = requestInfo;

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-bold">Oppgaver</h1>
      <p className="mt-2 text-slate-600">
        Opprett går via server action. Sletting går via fetch mot
        DELETE /api/tasks/:id, og krever admin.
      </p>

      <Suspense fallback={<TaskListSkeleton />}>
        <Tasks />
      </Suspense>

      <a className="mt-10 inline-block text-sm underline" href="/">
        Til forsiden
      </a>

      <DemoUserPanel user={ctx.user} />
    </main>
  );
}

/**
 * Henter oppgavene. Async server-komponent: React venter på den, og viser
 * fallbacken til <Suspense> i mellomtiden.
 */
async function Tasks() {
  const { ctx, request } = requestInfo;

  // Demo: tregt nett, så skjelettet rekker å vises. Se lib/demo-chaos.ts.
  await demoDelay(request, 800);

  // `ctx.user` MÅ sendes med. Glemmer du den, kompilerer ikke koden.
  const result = await taskService.list(ctx.user);

  // Result tvinger oss til å tenke på feilen. Her får brukeren en melding i
  // stedet for en hvit side.
  if (!result.success) {
    return (
      <p role="alert" className="mt-6 text-red-600">
        Klarte ikke å hente oppgavene: {result.error.message}
      </p>
    );
  }

  return <TaskList tasks={result.data} />;
}

/** Grå plassholdere mens lista lastes. Samme form som skjema + lista. */
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
