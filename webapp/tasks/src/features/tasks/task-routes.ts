import { route } from "rwsdk/router";
import { requireAdmin, requireUser } from "@/features/auth/middleware";
import { taskController } from "./task-controller";

/**
 * API-rutene for oppgaver. Spres inn i defineApp i worker.tsx.
 *
 * Bare kobling her: URL + metode + vakter -> controller-metode. Hva som skjer
 * står i controlleren, hvem som får lov står i vaktene.
 *
 *   lesing    åpen
 *   skriving  krever innlogging   [requireUser, ...]
 *   sletting  krever admin        [requireAdmin, ...]
 *
 * Vakten står FØRST i lista, og handleren sist. Slipper ikke vakten deg forbi,
 * kjører handleren aldri.
 *
 * Vaktene er en EKSTRA, tidlig sperre. Selve regelen står i servicen, som
 * sier nei uansett. Fjerner du `requireAdmin` under, får du fortsatt 403.
 * Prøv det. (Se "HVOR BOR AUTH-SJEKKEN?" i task-service.ts.)
 *
 * curl-eksempler (én linje, kan limes rett inn). Sett $ID først:
 *   ID=$(curl -s localhost:5173/api/tasks | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
 *
 *   curl -s localhost:5173/api/tasks
 *   curl -s "localhost:5173/api/tasks?completed=false&q=oblig&limit=5"
 *   curl -i "localhost:5173/api/tasks?limit=tull"   (400, validateListParams)
 *   curl -i localhost:5173/api/tasks/finnesikke
 *   curl -i -X POST localhost:5173/api/tasks -H "content-type: application/json" -H "x-demo-user: admin" -d '{"title":"Skrive obligen"}'
 *   curl -i -X POST localhost:5173/api/tasks -H "content-type: application/json" -H "x-demo-user: admin" -d '{"title":""}'
 *   curl -i -X POST localhost:5173/api/tasks -H "content-type: application/json" -H "x-demo-user: admin" -d '{"title":"Med frist","dueDate":"2000-01-01"}'   (400, validateTask)
 *   curl -i -X PUT localhost:5173/api/tasks/$ID -H "content-type: application/json" -H "x-demo-user: admin" -d '{"title":"Nytt navn","completed":true}'
 *   curl -i -X POST localhost:5173/api/tasks/$ID/complete -H "x-demo-user: admin"
 *   curl -i -X DELETE localhost:5173/api/tasks/$ID -H "x-demo-user: bruker"   (403)
 *   curl -i -X DELETE localhost:5173/api/tasks/$ID -H "x-demo-user: admin"    (204)
 *
 * Thunder Client: se DELETE nederst.
 */
export const taskRoutes = [
  route("/api/tasks", {
    get: taskController.list,
    post: [requireUser, taskController.create],
  }),

  route("/api/tasks/:id", {
    get: taskController.get,
    put: [requireUser, taskController.update],

    /**
     * DELETE /api/tasks/:id   204 / 401 / 403 / 404
     *
     * Dette er ruta TaskList.tsx kaller med fetch() når du trykker "Slett".
     *
     * ---------------------------------------------------------------------
     * THUNDER CLIENT (eller Postman/Bruno)
     *
     *   1. Hent en id:   GET  http://localhost:5173/api/tasks
     *                    kopier "id" fra en av oppgavene i "data"
     *
     *   2. Ny request:   DELETE  http://localhost:5173/api/tasks/<id>
     *
     *   3. Headers (velg ÉN):
     *        x-demo-user   admin               <- enklest
     *        Cookie        demo-user=admin     <- samme som nettleseren sender
     *
     *   4. Body:         ingen
     *
     *   Forventet svar:
     *     ingen header            401  { success: false, error: { code: "UNAUTHORIZED", ... } }
     *     x-demo-user: bruker     403  { success: false, error: { code: "FORBIDDEN", ... } }
     *     x-demo-user: admin      204  (tom body)
     *     samme id én gang til    404  { success: false, error: { code: "NOT_FOUND", ... } }
     *
     *   I `npm run dev` er DELETE treg med vilje, og omtrent hver tredje gir
     *   500 (src/lib/demo-chaos.ts). Headeren `x-demo-chaos: off` skrur det av.
     * ---------------------------------------------------------------------
     *
     * TANKE: Thunder Client kan sette hvilken som helst header. Hva sier det
     * om hvor mye vi kan stole på `x-demo-user` og cookien?
     */
    delete: [requireAdmin, taskController.remove],
  }),

  // complete / uncomplete. En GET hit gir 405, fordi vi bare oppgir `post`.
  route("/api/tasks/:id/:action", {
    post: [requireUser, taskController.action],
  }),
];
