# Startprosjekt · Webapplikasjoner 2026

Et ferdig oppsett dere kan bygge prosjektet deres på. Alt dere trenger gjennom
hele semesteret er installert og satt opp, så dere slipper å installere pakker
midt i en oppgave.

RedwoodSDK · React 19 · Vite 8 · TypeScript 7 · Tailwind 4 · Drizzle + D1 ·
Zod 4 · Vitest · Playwright · Cloudflare Workers

---

## Krav

| | Versjon | Sjekk med |
| --- | --- | --- |
| Node.js | **22.12 eller nyere**, 24 anbefalt | `node -v` |
| npm eller pnpm | npm 11+, eller pnpm 10.16+ | `npm -v` / `pnpm -v` |

Prosjektet virker med **begge** pakkebehandlerne. Velg én og bruk den hele
semesteret. Ikke bland dem i samme prosjekt.

Cloudflare-konto trengs ikke for å komme i gang. Databasen kjører lokalt.

---

## Kom i gang

```bash
npm install        # eller: pnpm install
npm run dev        # eller: pnpm dev
```

Åpne `http://localhost:5173`.

Vil dere ha databasen i gang med en gang:

```bash
npm run migrate:dev    # lager tabellene i den lokale databasen
npm run seed           # legger inn litt testdata
```

**Velg én lockfil.** Repoet har både `package-lock.json` (npm) og
`pnpm-lock.yaml` (pnpm), så begge virker rett ut av boksen. Slett den dere ikke
bruker, så kan de ikke komme i utakt.

---

## Hva som ligger her

```
src/
├─ worker.tsx              inngangspunktet. Her registreres alle ruter
├─ client.tsx              starter React i nettleseren
├─ app/
│  ├─ Document.tsx         HTML-skallet rundt alle sider
│  ├─ headers.ts           sikkerhetsheadere, blant annet CSP
│  ├─ styles.css           én linje: @import "tailwindcss"
│  └─ pages/Home.tsx       forsiden. En server-komponent
├─ components/
│  ├─ Counter.tsx          en klient-komponent ("use client")
│  └─ __tests__/           komponenttest med Testing Library
├─ features/               alt som hører til én funksjon, samlet
│  ├─ auth/                setUser, requireUser, requireAdmin, DemoUserPanel
│  └─ tasks/
│     ├─ task-schema.ts      Zod: hva vi godtar utenfra
│     ├─ task-repository.ts  interface + factory, eneste som rører databasen
│     ├─ task-mapper.ts      Task (rad) -> TaskDTO (det klienten ser)
│     ├─ task-service.ts     forretningsregler, validering og tilgang
│     ├─ task-controller.ts  HTTP inn, Response ut
│     ├─ task-routes.ts      /api/tasks med vakter
│     ├─ actions.ts          server actions ("use server")
│     ├─ task-api.ts         fetch mot API-et fra nettleseren
│     ├─ utils/              rene funksjoner, ingen database
│     │  ├─ validate-task.ts         reglene for en oppgave
│     │  ├─ parse-params.ts          URL -> { q: "oblig" } (tekst)
│     │  └─ validate-list-params.ts  tekst -> typer, og er de lovlige?
│     ├─ components/         TaskList, TaskItem, CreateTaskForm, TaskFilter
│     ├─ pages/TasksPage.tsx /tasks
│     └─ __tests__/          komponent-, util-, controller- og integrasjonstest
├─ db/
│  ├─ schema/              tabellene. Eksempel: users og tasks
│  ├─ relations.ts         relasjonene mellom tabellene
│  ├─ index.ts             databaseklienten
│  └─ seed.ts              testdata
├─ lib/
│  ├─ id.ts                createId(), en id-generator
│  ├─ result.ts            Result<T>, Errors, executeDbOperation
│  ├─ response.ts          Result -> Response med riktig statuskode
│  └─ demo-chaos.ts        kunstig treghet og tilfeldige feil i dev
└─ test/setup-dom.ts       kjøres før hver testfil

e2e/                       Playwright-tester i ekte nettleser
drizzle/migrations/        én mappe per migrasjon. Slett aldri en gammel
public/                    statiske filer
```

Konfigurasjonen ligger i rota: `wrangler.jsonc` (hva appen har tilgang til),
`vite.config.mts`, `vitest.config.ts`, `playwright.config.ts`,
`drizzle.config.ts` og `tsconfig.json`.

**Tabellene i `src/db/schema/` er et eksempel.** Bytt dem ut med deres egen
datamodell, kjør `npm run migrate:new`, og dere har en ny migrasjon.

---

## Rød tråd: lag en oppgave

Følg én oppgave fra skjemaet til databasen og tilbake. Hver fil har én jobb,
og create går gjennom alle.

| # | Fil | Hva skjer med «create» |
| --- | --- | --- |
| 1 | `components/CreateTaskForm.tsx` | skjema med `title` og `dueDate`, `useActionState` |
| 2 | `components/TaskList.tsx` | `useOptimistic` viser oppgaven før serveren svarer |
| 3 | `actions.ts` | `createTaskAction`: FormData -> vanlige verdier, `""` -> ingen frist |
| 3b | `task-api.ts` -> `task-routes.ts` -> `task-controller.ts` | samme vei med fetch: `POST /api/tasks`, `requireUser`, JSON, 201 + `Location` |
| 4 | `task-service.ts` | innlogget? så Zod (formen), så `validateTask` (regelen), eier fra `ctx.user` |
| 5 | `task-schema.ts` | `createTaskSchema`: tar bare `title`, `completed`, `dueDate` |
| 6 | `utils/validate-task.ts` | tom eller for lang tittel, frist før i dag |
| 7 | `task-repository.ts` | `insert ... returning`, feil blir et Result |
| 8 | `src/db/schema/task-schema.ts` | tabellen, `CreateTask`-typen, id og `createdAt` lages her |
| 9 | `task-mapper.ts` | rad -> `TaskDTO`, datoer som ISO, uten `userId` |
| 10 | `pages/TasksPage.tsx` + `TaskItem.tsx` | rwsdk rendrer på nytt, den ekte oppgaven erstatter den optimistiske |

Testene følger samme tråd: `CreateTaskForm.test.tsx` (1), `task-controller.test.ts`
(3b), `task-service.test.ts` (4–8 mot SQLite i minnet), `validate-task.test.ts`
(6), `task-mapper.test.ts` (9) og `e2e/tasks.e2e.ts` (alt sammen).

---

## Rød tråd: list oppgaver

Samme lag, motsatt vei: fra URL-en til databasen og tilbake.

**List er skrevet ut uten hjelpere.** Ingen `respond`, `readJson`,
`executeDbOperation` eller `ResultHandler`: hvert lag lager sitt `Result` og
sin `Response` selv. Sammenlign med create, som gjør nøyaktig det samme, bare
kortere.

| # | Fil | Hva skjer med «list» |
| --- | --- | --- |
| 1 | `components/TaskFilter.tsx` | GET-skjema. Nettleseren lager `/tasks?q=oblig&completed=false` selv |
| 2 | `pages/TasksPage.tsx` | `parseParams(request)`, så `taskService.list(ctx.user, params)` |
| 2b | `task-api.ts` -> `task-routes.ts` -> `task-controller.ts` | samme vei med fetch: `GET /api/tasks?...`, `parseParams`, `Response.json` med 200 / 400 |
| 3 | `utils/parse-params.ts` | URL -> `{ completed: "false", q: "oblig" }`. Fortsatt tekst |
| 4 | `task-service.ts` | `validateListParams`, 400 med feil per felt, ellers repositoryet |
| 5 | `utils/validate-list-params.ts` | `"false"` -> `false`, `"5"` -> `5`, `limit` 1–100, tomt = ikke satt |
| 6 | `task-repository.ts` | `db.query.tasks.findMany({ where, orderBy, limit })`, `try/catch` skrevet ut |
| 7 | `task-mapper.ts` | rad -> `TaskDTO` |
| 8 | `components/TaskList.tsx` + `TaskItem.tsx` | viser lista |

Query-parametere (`?q=oblig`) er ikke det samme som `params` i rwsdk. Det er
sti-parametere (`/api/tasks/:id` -> `params.id`).

```bash
curl -s "localhost:5173/api/tasks?completed=false&q=oblig&limit=5"
curl -i "localhost:5173/api/tasks?limit=tull"      # 400, feil per felt
```

Testene, ett lag hver: `TaskFilter.test.tsx` (1, komponent), `list-params.test.ts`
(3 og 5, util), `task-controller.test.ts` (2b), `task-service.test.ts` (4–7 mot
SQLite i minnet) og `e2e/tasks.e2e.ts` (filteret i ekte nettleser).

---

## Kommandoer

| Kommando | Hva den gjør |
| --- | --- |
| `npm run dev` | utviklingsserver på port 5173 |
| `npm run lint` | typesjekk med TypeScript |
| `npm test` | kjører testene én gang |
| `npm run test:watch` | kjører testene på nytt når dere lagrer |
| `npm run test:e2e` | Playwright i ekte nettleser |
| `npm run migrate:new` | lager en migrasjon fra `src/db/schema/` |
| `npm run migrate:dev` | kjører migrasjonene mot den lokale databasen |
| `npm run seed` | legger inn testdata |
| `npm run generate` | oppdaterer typene etter endring i `wrangler.jsonc` |
| `npm run build` | bygger for produksjon |

Bruker dere pnpm, dropp `run`: `pnpm dev`, `pnpm lint`, `pnpm test`.

---

## Databasen

Databasen er **D1**, som er SQLite hos Cloudflare. Lokalt er den bare en fil
under `.wrangler/`, så dere trenger ingen konto for å jobbe.

Slik endrer dere datamodellen:

1. Endre eller legg til en tabell i `src/db/schema/`
2. `npm run migrate:new` lager en migrasjonsfil
3. `npm run migrate:dev` kjører den mot den lokale databasen

En migrasjon er en dagbok: dere **legger til** en ny, og redigerer aldri en som
har kjørt. Har databasen havnet i en rar tilstand, slett `.wrangler/` og kjør
migrasjonene og seed på nytt.

---

## Tester

Det er to slags tester i prosjektet, og de svarer på hver sine spørsmål.

**Vitest** er den dere bruker hele tiden. Rask, kjører i terminalen.

```bash
npm test
npm run test:watch
```

Vanlige tester kjører i Node. Skal testen rendre en komponent, må fila ha denne
linja helt øverst:

```ts
// @vitest-environment happy-dom
```

Se `src/components/__tests__/Counter.test.tsx` for et eksempel med klikk.

**Playwright** starter en ekte nettleser og klikker seg gjennom appen. Tregere,
så bruk den på de viktige flytene.

```bash
npx playwright install chromium   # bare første gang
npm run test:e2e
```

---

## Tregt nett og tilfeldige feil (demo)

I `npm run dev` er serveren med vilje treg, og lagring feiler ca. hver 3. gang.
Da ser dere skjelettet mens lista lastes, «lagrer…», og at `useOptimistic`
ruller tilbake. Se `src/lib/demo-chaos.ts`.

Av i produksjon, og av for forespørsler med headeren `x-demo-chaos: off`.
Playwright sender den, så e2e-testene er stabile.

---

## Breakpoints i VS Code

Koden kjører tre forskjellige steder, og hvert sted trenger sin debugger:

| Kode | Kjører i | Debugger |
| --- | --- | --- |
| server-komponenter, actions, controller, service | `workerd` | attach til port 9229 |
| `"use client"`-komponenter | nettleseren | Chrome |
| Vitest-tester | Node | launch Vitest |

Åpne `webapp/tasks` som mappe i VS Code, og lag `.vscode/launch.json`:

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      // 1. Start `npm run dev` først. 2. Kjør denne. 3. Last siden.
      "name": "Worker (server)",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "cwd": "/",
      "resolveSourceMapLocations": null,
      "attachExistingChildren": false,
      "autoAttachChildProcesses": false,
      "sourceMaps": true
    },
    {
      "name": "Nettleser (klient)",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173/tasks",
      "webRoot": "${workspaceFolder}"
    },
    {
      // Åpne en testfil, og kjør denne.
      "name": "Vitest (denne fila)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "smartStep": true,
      "console": "integratedTerminal"
    }
  ]
}
```

Port 9229 er standard. Er den opptatt (en annen dev-server kjører), velger Vite
en annen og skriver `Default inspector port 9229 not available, using 9230
instead`. Bytt da `port`, eller stopp den andre serveren.

`debugger;` i koden virker også, så lenge en debugger er koblet til.

---

## Windows

Alt virker på Windows, men noen kommandoer skrives annerledes i PowerShell.
Enkleste løsning: installer [Git for Windows](https://gitforwindows.org/) og
kjør alt i **Git Bash**.

Ellers:

- Installer Node med [fnm](https://github.com/Schniz/fnm) eller
  [nvm-windows](https://github.com/coreybutler/nvm-windows), ikke fra Microsoft
  Store
- Legg prosjektet på en kort sti, for eksempel `C:\dev\`, og **ikke** i OneDrive.
  Synkronisering låser filer i `node_modules` og `.wrangler`
- `git config --global core.autocrlf input`
- Er noe veldig tregt, legg `node_modules`, `.wrangler` og `.vite` som unntak i
  Windows Defender

---

## Når noe ikke virker

| Problem | Løsning |
| --- | --- |
| Porten er opptatt | Noe annet kjører på 5173. Stopp det, eller kjør `npm run dev -- --port 5174` |
| `npm run dev` starter ikke etter install | Installasjonen hoppet over byggesteg. Kjør install på nytt, og se etter en advarsel om install-scripts |
| TypeScript finner ikke `env.DB` | `npm run generate` |
| «No migrations to apply» | Dere står i feil mappe, eller migrasjonen er ikke laget ennå |
| Testene klager på `better-sqlite3` | Slett `node_modules`, installer på nytt |
| Rare feil etter en oppdatering | `npm run clean`, så start dev-serveren på nytt |
| Databasen er i en rar tilstand | Slett `.wrangler/`, kjør `migrate:dev` og `seed` |
| Playwright finner ingen nettleser | `npx playwright install chromium` |

---

## Om versjonene

Alle pakker er låst til **eksakte** versjoner, uten `^` og `~`. Det er med
vilje: da har alle på gruppa nøyaktig det samme, og en oppdatering midt i
semesteret kan ikke ødelegge noe som virket i går.

To ting er verdt å vite hvis dere spør en KI-modell om hjelp:

- **Drizzle.** Vi bruker versjon 1, som ligger under `rc` hos npm. Det npm
  kaller `latest` er fortsatt versjon 0, med et helt annet API. «Oppdater til
  siste» er altså en nedgradering her.
- **Tailwind 4.** All konfigurasjon skjer i CSS, i en `@theme`-blokk. Foreslår
  modellen en `tailwind.config.js`, svarer den for versjon 3.

`AGENTS.md` i denne mappa oppsummerer versjonene og reglene. Bruker dere Cursor,
Claude Code, Copilot eller lignende, les den fila selv også, og pek verktøyet på
den.
