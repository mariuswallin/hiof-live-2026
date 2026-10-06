"use server";

import { requestInfo } from "rwsdk/worker";
import { demoDelay, demoFailure } from "@/lib/demo-chaos";
import type { ResultError } from "@/lib/result";
import type { TaskDTO } from "./task-mapper";
import { taskService } from "./task-service";

/**
 * SERVER ACTIONS.
 *
 * `"use server"` MÅ stå på linje 1, på samme måte som `"use client"`. Da blir
 * hver eksporterte funksjon i fila et endepunkt: klienten importerer den som
 * en helt vanlig funksjon, men kallet går over nettet, og koden kjører aldri
 * i nettleseren.
 *
 * To ting å ha i hodet:
 *
 *   1. Argumentene kommer utenfra. Her validerer SERVICEN dem, akkurat som
 *      for API-et. Samme regler, ett sted.
 *   2. Mellomvaren i worker.tsx vokter RUTER. En server action er en egen
 *      inngang, og går ALDRI gjennom requireUser/requireAdmin. Det er derfor
 *      tilgangssjekken ligger i servicen: actionen sender bare `ctx.user`
 *      videre, og servicen sier nei. Ingen sjekk her å glemme.
 *
 * Etter en server action rendrer rwsdk siden på nytt med ferske data fra
 * serveren. Derfor trenger vi ingen `revalidatePath` eller manuell refetch.
 */

/**
 * Tilstanden skjemaet får tilbake fra useActionState. `null` = ingenting
 * sendt ennå. `values` sendes tilbake ved feil, så brukeren slipper å skrive
 * alt på nytt.
 */
export type CreateTaskFormState =
  | { success: true; task: TaskDTO }
  | { success: false; error: ResultError; values: { title: string } }
  | null;

/**
 * Lag en oppgave fra et skjema.
 *
 * Signaturen `(prevState, formData)` er det `useActionState` krever: React
 * sender inn forrige tilstand og skjemadataene, og det vi returnerer blir den
 * nye tilstanden.
 */
export async function createTaskAction(
  _prevState: CreateTaskFormState,
  formData: FormData,
): Promise<CreateTaskFormState> {
  // FormData gir `FormDataEntryValue | null`. String() gjør det til tekst, så
  // Zod i servicen kan gi en ordentlig feilmelding i stedet for en typefeil.
  const values = { title: String(formData.get("title") ?? "") };
  const { ctx, request } = requestInfo;

  // Demo: tregt nett, og feil ca. hver 3. gang. Se lib/demo-chaos.ts.
  await demoDelay(request, 1200);
  const chaos = demoFailure(request);
  if (chaos) return { success: false, error: chaos, values };

  // Ikke innlogget? Servicen svarer UNAUTHORIZED. Se punkt 2 over.
  const result = await taskService.create(ctx.user, values);

  return result.success
    ? { success: true, task: result.data }
    : { success: false, error: result.error, values };
}

/**
 * Kryss av / fjern avkryssing. Kalles direkte fra TaskItem, ikke via skjema,
 * så den tar vanlige argumenter i stedet for FormData.
 */
export async function toggleTaskCompleted(id: string, completed: boolean) {
  const { ctx, request } = requestInfo;

  // Demo: haken flytter seg med én gang, og hopper tilbake når dette feiler.
  await demoDelay(request, 1000);
  const chaos = demoFailure(request);
  if (chaos) return { success: false as const, error: chaos.message };

  const result = await taskService.update(ctx.user, id, { completed });

  // Det som returneres må kunne serialiseres. Et vanlig objekt går fint.
  return result.success
    ? { success: true as const, task: result.data }
    : { success: false as const, error: result.error.message };
}
