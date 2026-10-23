# Test-oppskrift: mobilappen mot webappen

Denne mappa er en kopi av `hiof-live-2026/mobile/demo`, med tre steg lagt inn:

- **Steg 0:** lista hentes fra `webapp/tasks` (main), og nye oppgaver lagres der med `fetch`.
- **Steg 1:** toggle og slett går også mot webappen.
- **Steg 2:** tabs, en stack inne i Oppgaver-taben, en detaljside og «Ny oppgave» som egen skjerm.

## Se endringene

- **Fil for fil per steg:** `steg-0.md`, `steg-1.md` og `steg-2.md`.

- Utgangspunktet (demo slik den er på main) er committet, så `git status` og `git diff` viser alt som er endret.
- I koden er hver endring merket `STEG 0:`, `STEG 1:` eller `STEG 2:`. Øverst i hver berørt fil står hvilke andre filer steget går gjennom.
- **Bare steg 2:** `git diff demo-api-steg-1 -- mobile/demo-api` viser endringene i filer som fantes etter steg 1. Den lokale taggen `demo-api-steg-1` er et øyeblikksbilde av steg 0+1. Filene som er helt nye i steg 2, vises ikke der. Det er `(tabs)/`, `new-task.tsx` og `Icon.tsx`.

## Filene

**Steg 0 og 1:**

| Fil | Steg 0: liste og opprett | Steg 1: toggle og slett |
|---|---|---|
| `src/api/tasks.ts` (ny) | `listTasks()` (GET) og `createTask()` (POST) | `updateTask()` (PATCH) og `deleteTask()` (DELETE, 204 uten body) |
| `src/contexts/TasksContext.tsx` | Tom liste og `useEffect`, `isLoading`, `error`, `toTask()` og `addApi()` | `toggleApi()` venter på serveren. `removeApi()` er optimistisk og ruller tilbake ved feil. |
| `src/components/tasks/TaskList.tsx` | – | Sender `onRemove` videre |
| `src/components/tasks/TaskItem.tsx` | – | Bruker `onToggle`-propen i stedet for `toggle()` fra context, og har fått en Slett-knapp |

**Steg 2:**

| Fil | Hva |
|---|---|
| `src/app/index.tsx` | **Slettet.** Innholdet er delt mellom de tre neste filene. |
| `src/app/(tabs)/index.tsx` (ny) | Hjem (`/`): lenkene og «Antall tasks» |
| `src/app/(tabs)/tasks/index.tsx` (ny) | Lista (`/tasks`), med koden fra steg 0 og 1, og «+» i headeren |
| `src/app/new-task.tsx` (ny) | Skjemaet. Gjør `addApi()` og så `router.back()`. |
| `src/app/(tabs)/_layout.tsx` (ny) | Tab-baren, med ikoner og badge (antall åpne oppgaver) |
| `src/app/(tabs)/tasks/_layout.tsx` (ny) | Stacken i taben, med `anchor: "index"` |
| `src/app/(tabs)/tasks/[id].tsx` (ny) | Detaljsiden. Henter med `getTask()` og har knapper for toggle og slett. |
| `src/app/_layout.tsx` | Rot-Stacken: `(tabs)` med `headerShown: false`, `new-task`, og `anchor: "(tabs)"` |
| `src/api/tasks.ts` | `getTask()` og `ApiTaskDetailSchema` (opprettet og frist) |
| `src/components/tasks/TaskList.tsx` | `TaskRegister` og `onRegister` er fjernet |
| `src/components/tasks/TaskItem.tsx` | Raden er en vanlig `View`. Boksen toggler, tittelen er en `Link` til detaljsiden, og Slett sletter. |
| `src/components/shared/Icon.tsx` (ny) | Tab-ikoner (`expo-symbols`) |

`toggle()` og `add()` i contexten er uendret og bare lokale. De står igjen for sammenligning.

## Før du starter

1. Start webappen: `npm run dev` i `hiof-live-2026/webapp/tasks`.
2. Åpne http://localhost:5173/api/v1/tasks i nettleseren. Du skal se `{ "ok": true, "data": [...] }`.
3. Start appen: kjør `pnpm start` i `mobile/demo-api` og trykk `i`.
   - **Ikke trykk `w`.** På web stopper nettleseren kallene (CORS).

## Test i iOS-simulatoren

### Steg 0: liste og opprett

1. **Hjem (`/`):** «Antall tasks» stemmer med JSON-en i nettleseren. Tab-baren nederst har Hjem og Oppgaver.
2. **Oppgaver-taben:** du ser «Henter oppgaver fra webappen ...», og så lista.
3. **Lag en oppgave:** trykk «+» oppe til høyre, skriv en tittel og trykk «Register Task». Skjemaet lukkes, og oppgaven ligger øverst i lista.
   - Oppdater http://localhost:5173/tasks, så ligger den der også.
4. **Refresh:** trykk `r` i Expo-terminalen. Oppgaven er der fortsatt, fordi den er lagret i webappen.
5. **Valideringsfeil fra serveren:** registrer med bare mellomrom. Skjemaet blir stående, og «Tittel kan ikke være tom» vises i rødt. Meldingen kommer fra webappen (400).
6. **Nettverksfeil:** stopp webappen (Ctrl+C) og trykk `r`. Da vises «Network request failed» i lista. Start webappen igjen og trykk `r`.

### Steg 1: toggle og slett (i lista)

7. **Toggle:** trykk på avkrysningsboksen. Haken kommer et lite øyeblikk etter trykket, fordi appen venter på serveren. Trykk `r`, og statusen er den samme.
8. **Slett:** trykk «Slett» på en rad. Raden forsvinner med en gang, fordi slettingen er optimistisk. Serveren bruker 1 sekund. Trykk `r`, og den er fortsatt borte.
9. **Tilbakerulling:** slett noen ganger til du får «Tilfeldig feil (demo). Prøv igjen.» i rødt. Raden forsvinner først og kommer så tilbake. Webappen feiler med vilje omtrent hver tredje DELETE i dev (`demo-chaos.ts`).

### Steg 2: tabs, stack og detaljside

10. **Badge:** tallet på Oppgaver-ikonet er antall åpne oppgaver, og det endres når du toggler.
11. **Detaljside:** trykk på en tittel. Detaljsiden legges oppå lista, tab-baren blir stående, og headeren viser tittelen og en tilbake-knapp. Du ser «Opprettet» og «Frist», som er hentet med `getTask()`.
12. **Toggle på detaljsiden:** statusen endres, og den er endret i lista også når du går tilbake (samme context).
13. **Slett på detaljsiden:** du kommer tilbake til lista, og raden er borte. Får du demo-feilen, vises en Alert, og raden kommer tilbake.
14. **Ny oppgave over tabs:** «+» åpner skjemaet uten tab-bar. «Avbryt» går tilbake.
15. **Tabs husker bunken:** åpne en detaljside, bytt til Hjem, og bytt tilbake til Oppgaver. Du er fortsatt på detaljsiden.
16. **Lenker fra Hjem:** «Gå til oppgaver» bytter tab. «Ny oppgave» åpner skjemaet.

## Sjekk webappen med curl (valgfritt)

```sh
curl -s localhost:5173/api/v1/tasks
curl -s localhost:5173/api/v1/tasks/<id>                                                                      # detaljsiden
curl -i -X POST localhost:5173/api/v1/tasks -H "content-type: application/json" -d '{"title":"Fra curl"}'   # 201
curl -i -X POST localhost:5173/api/v1/tasks -H "content-type: application/json" -d '{"title":""}'          # 400
curl -i -X PATCH localhost:5173/api/v1/tasks/<id> -H "content-type: application/json" -d '{"completed":true}' # 200
curl -i -X DELETE localhost:5173/api/v1/tasks/<id> -H "x-demo-chaos: off"                                    # 204, så 404
```

## Andre plattformer

| Kjører appen på | CORS? | `BASE_URL` i `src/api/tasks.ts` |
|---|---|---|
| iOS-simulator | Nei | `http://localhost:5173/api/v1` |
| Android-emulator | Nei | `http://10.0.2.2:5173/api/v1` |
| Fysisk telefon (Expo Go) | Nei | `http://<Mac-ens IP>:5173/api/v1`, og start webappen med `npm run dev -- --host` |
| Web (`w`) | **Ja, blokkeres** | Krever CORS-mellomvare i webappens `worker.tsx` |

## NB

Ikke kjør `npm run lint` i demo. `eslint` er ikke installert der, så `expo lint` installerer det selv med npm. Da endres `package.json` og lock-filene, og `node_modules` blir rotete.
