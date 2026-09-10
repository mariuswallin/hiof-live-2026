import { Counter } from "@/components/Counter";
import { TimeClient } from "@/components/TimeClient";
import { db } from "@/db";
import { tasks } from "@/db/schema";

/**
 * En server-komponent. Den kjører på serveren, én gang per forespørsel, og
 * nettleseren får ferdig HTML. Derfor viser klokka under tidspunktet på
 * serveren, og den endrer seg bare når du laster siden på nytt.
 *
 * Server-komponent er standarden i RedwoodSDK. Trenger du klikk eller state,
 * lager du en klient-komponent, som `Counter` under.
 */
export async function Home() {
  const now = new Date().toLocaleString("no-NO");

  const allTasks = await db.select().from(tasks);

  console.log("allTasks", allTasks);

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-bold">Webapplikasjoner 2026</h1>
      <p className="mt-2 text-slate-600">
        Startprosjektet virker. Nå kan dere begynne å bygge.
      </p>

      <p className="mt-6 text-sm text-slate-500">
        Rendret på serveren {now}. Last siden på nytt, så endrer tallet seg.
      </p>
      <TimeClient />
      <Counter />

      <h2 className="mt-10 text-xl font-semibold">Oppgaver</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
        {allTasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Prøv dette</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
        <li>
          Åpne{" "}
          <a className="underline" href="/api/status">
            /api/status
          </a>
          . Det er en rute som svarer JSON i stedet for HTML.
        </li>
        <li>
          Endre teksten i src/app/pages/Home.tsx og se at siden oppdaterer seg.
        </li>
        <li>Trykk på knappen over. Den er en klient-komponent.</li>
      </ul>
    </main>
  );
}
