# Test-oppskrift: mobilappen mot webappen

Denne mappa er en kopi av `hiof-live-2026/mobile/demo`, med tre steg:

- **Steg 0:** lista hentes fra `webapp/tasks` (main), og nye oppgaver lagres der med `fetch`.
- **Steg 1:** toggle og slett går også mot webappen.
- **Steg 2A:** innlogging mot webappen. Tokenet sendes på alle kall, og `Stack.Protected` viser login eller appen.
- **Steg 2B:** tabs, en stack inne i Oppgaver-taben, en detaljside og «Ny oppgave» som egen skjerm.

## Se endringene

- **Fil for fil per steg:** `steg-0.md`, `steg-1.md` og `steg-2.md`.
- **Utgangspunktet er committet:** live `mobile/demo` på `cef52b0`, altså steg 0 og 1 ferdig og før auth. Taggen heter `demo-api-steg-2-baseline`. `git status` og `git diff` viser derfor bare steg 2.
- I koden er endringene merket `STEG 2A:` (auth), `STEG 2B:` (tabs) eller `STEG 2:` (småting). Øverst i hver berørt fil står hvilke andre filer steget går gjennom.
- Steg 0 og 1 ligger i baseline, uten `STEG 0:`- og `STEG 1:`-kommentarer, fordi koden er den samme som i live. Den gamle kommenterte versjonen finnes i taggen `demo-api-steg-1`.

## Filene

**Steg 0 og 1** (ferdig i baseline):

| Fil | Steg 0: liste og opprett | Steg 1: toggle og slett |
|---|---|---|
| `src/api/tasks.ts` | `listTasks()` (GET) og `createTask()` (POST) | `updateTask()` (PATCH) og `deleteTask()` (DELETE, 204 uten body) |
| `src/contexts/TasksContext.tsx` | Tom liste og `useEffect`, `isLoading`, `error`, `toTask()` og `addApi()` | `toggleApi()` venter på serveren. `removeApi()` er optimistisk og ruller tilbake ved feil. |
| `src/components/tasks/TaskList.tsx` | – | Sender `onRemove` videre |
| `src/components/tasks/TaskItem.tsx` | – | Bruker `onToggle`-propen, og har fått en Slett-knapp |

**Steg 2A: auth:**

| Fil | Hva |
|---|---|
| `src/api/auth.ts` (ny) | `login(userId)`, som gjør `POST /api/v1/login` og gir `{ token, user }` |
| `src/api/tasks.ts` | `token` er første parameter i alle funksjonene, og sendes som `authorization: Bearer ...`. Android-host. |
| `src/contexts/AuthContext.tsx` | `token` og `user` i minnet, `login()` og `logout()`. Den hardkodede brukeren og `isLoading` er borte. |
| `src/contexts/TasksContext.tsx` | Henter på nytt når `token` endrer seg (`[token]`), og har `requireToken()` |
| `src/app/login.tsx` (ny) | To knapper, Kari (admin) og Ola (user) |
| `src/app/_layout.tsx` | `Stack.Protected`: `login` uten bruker, resten med bruker, og `admin` bare for admin |
| `src/app/(tabs)/index.tsx` | Navn, rolle og «Logg ut» |

**Steg 2B: tabs:**

| Fil | Hva |
|---|---|
| `src/app/index.tsx` | **Slettet.** Innholdet er delt mellom de tre neste filene. |
| `src/app/(tabs)/index.tsx` (ny) | Hjem (`/`): brukerraden, «Antall tasks» og lenkene |
| `src/app/(tabs)/tasks/index.tsx` (ny) | Lista (`/tasks`), med koden fra steg 0 og 1, og «+» i headeren |
| `src/app/new-task.tsx` | Skjemaet. Gjør `addApi()` og så `router.back()`, og viser feilen hvis lagringen feiler. |
| `src/app/(tabs)/_layout.tsx` (ny) | Tab-baren, med ikoner og badge (antall åpne oppgaver) |
| `src/app/(tabs)/tasks/_layout.tsx` (ny) | Stacken i taben, med `anchor: "index"` |
| `src/app/(tabs)/tasks/[id].tsx` (ny) | Detaljsiden. Henter med `getTask(token, id)` og har knapper for toggle og slett. |
| `src/app/_layout.tsx` | `(tabs)` med `headerShown: false`, `new-task`, og `anchor: "(tabs)"` |
| `src/api/tasks.ts` | `getTask()` og `ApiTaskDetailSchema` (opprettet og frist) |
| `src/components/tasks/TaskList.tsx` | `TaskRegister` og `onRegister` er fjernet |
| `src/components/tasks/TaskItem.tsx` | Boksen toggler, tittelen er en `Link` til detaljsiden, og Slett sletter |
| `src/components/shared/Icon.tsx` (ny) | Tab-ikoner (`expo-symbols`) |

`toggle()` og `add()` i contexten er uendret og bare lokale. De står igjen for sammenligning.

## Før du starter

1. Start webappen: `npm run dev` i `hiof-live-2026/webapp/tasks`. Er databasen tom, kjør `npm run seed` først.
2. Sjekk API-et:
   - `curl -s localhost:5173/api/v1/tasks` gir **401**.
   - `curl -s localhost:5173/api/v1/tasks -H "authorization: Bearer 1"` gir Karis liste.
3. Start appen: kjør `pnpm start` i `mobile/demo-api` og trykk `i`.
   - Web (`w`) skal også virke, fordi webappen tillater `http://localhost:8081` (`webapp/tasks/src/app/cors.ts`). Det er ikke testet her, så bruk iOS-simulatoren.

## Test i iOS-simulatoren

### Steg 2A: auth

A1. **Login først:** appen åpner på «Logg inn», uten tab-bar. Det er ingen vei forbi.
A2. **Logg inn som Kari:** du havner på Hjem. Den viser «Kari Nordmann (admin)» og lenken «Gå til admin».
A3. **Logg ut:** du er tilbake på «Logg inn». Tab-baren og alt i den er borte.
A4. **Logg inn som Ola:** Hjem viser «Ola Hansen (user)», uten admin-lenke. Lista viser bare Olas egne oppgaver, så «Antall tasks» er lavere enn hos Kari.
A5. **Ola sletter:** trykk «Slett». Raden forsvinner, kommer tilbake, og «Bare admin har lov til dette» vises i rødt (403 fra webappen).
A6. **Restart:** trykk `r`. Du er på «Logg inn» igjen, fordi tokenet bare lå i minnet.
A7. **Webappen nede:** stopp webappen og trykk på en bruker. «Network request failed» vises under knappene.

Resten av testene gjøres som **Kari**, som får slette.

### Steg 0: liste og opprett

1. **Hjem (`/`):** «Antall tasks» stemmer med `curl ... -H "authorization: Bearer 1"`. Tab-baren nederst har Hjem og Oppgaver.
2. **Oppgaver-taben:** du ser «Henter oppgaver fra webappen ...», og så lista.
3. **Lag en oppgave:** trykk «+» oppe til høyre, skriv en tittel og trykk «Register Task». Skjemaet lukkes, og oppgaven ligger øverst i lista.
   - Logg inn som Kari på http://localhost:5173/login og åpne /tasks. Oppgaven ligger der også.
4. **Refresh:** trykk `r` i Expo-terminalen og logg inn igjen. Oppgaven er der fortsatt, fordi den er lagret i webappen.
5. **Valideringsfeil fra serveren:** registrer med bare mellomrom. Skjemaet blir stående, og «Tittel kan ikke være tom» vises i rødt. Meldingen kommer fra webappen (400).
6. **Nettverksfeil:** når du er innlogget, stopp webappen (Ctrl+C) og logg ut og inn igjen. Login feiler med «Network request failed». Start webappen igjen.

### Steg 1: toggle og slett (i lista)

7. **Toggle:** trykk på avkrysningsboksen. Haken kommer et lite øyeblikk etter trykket, fordi appen venter på serveren.
8. **Slett:** trykk «Slett» på en rad. Raden forsvinner med en gang, fordi slettingen er optimistisk. Serveren bruker 1 sekund.
9. **Tilbakerulling:** slett noen ganger til du får «Tilfeldig feil (demo). Prøv igjen.» i rødt. Raden forsvinner først og kommer så tilbake. Webappen feiler med vilje omtrent hver tredje DELETE i dev (`demo-chaos.ts`).

### Steg 2B: tabs, stack og detaljside

10. **Badge:** tallet på Oppgaver-ikonet er antall åpne oppgaver, og det endres når du toggler.
11. **Detaljside:** trykk på en tittel. Detaljsiden legges oppå lista, tab-baren blir stående, og headeren viser tittelen og en tilbake-knapp. Du ser «Opprettet» og «Frist», som er hentet med `getTask()`.
12. **Toggle på detaljsiden:** statusen endres, og den er endret i lista også når du går tilbake (samme context).
13. **Slett på detaljsiden:** du kommer tilbake til lista, og raden er borte. Får du demo-feilen, vises en Alert, og raden kommer tilbake. Som Ola får du alltid en Alert med «Bare admin har lov til dette».
14. **Ny oppgave over tabs:** «+» åpner skjemaet uten tab-bar. «Avbryt» går tilbake.
15. **Tabs husker bunken:** åpne en detaljside, bytt til Hjem, og bytt tilbake til Oppgaver. Du er fortsatt på detaljsiden.
16. **Lenker fra Hjem:** «Gå til oppgaver» bytter tab. «Ny oppgave» åpner skjemaet.

## Sjekk webappen med curl (valgfritt)

`Bearer 1` er Kari (admin) og `Bearer 2` er Ola (user). Tokenet er bare bruker-id-en.

```sh
curl -s -X POST localhost:5173/api/v1/login -H "content-type: application/json" -d '{"userId":2}'   # { token: "2", user }
curl -i localhost:5173/api/v1/tasks                                                                   # 401
curl -s localhost:5173/api/v1/tasks -H "authorization: Bearer 2"                                      # bare Olas
curl -s localhost:5173/api/v1/tasks/<id> -H "authorization: Bearer 1"                                 # detaljsiden
curl -i -X POST localhost:5173/api/v1/tasks -H "authorization: Bearer 1" -H "content-type: application/json" -d '{"title":"Fra curl"}'  # 201
curl -i -X PATCH localhost:5173/api/v1/tasks/<id> -H "authorization: Bearer 1" -H "content-type: application/json" -d '{"completed":true}'  # 200
curl -i -X DELETE localhost:5173/api/v1/tasks/<id> -H "authorization: Bearer 2"                       # 403
curl -i -X DELETE localhost:5173/api/v1/tasks/<id> -H "authorization: Bearer 1" -H "x-demo-chaos: off" # 204, så 404
```

## Andre plattformer

| Kjører appen på | CORS? | `BASE_URL` i `src/api/tasks.ts` |
|---|---|---|
| iOS-simulator | Nei | `http://localhost:5173/api/v1` |
| Android-emulator | Nei | `http://10.0.2.2:5173/api/v1`. Velges automatisk med `Platform.OS`, men er ikke testet. |
| Fysisk telefon (Expo Go) | Nei | `http://<Mac-ens IP>:5173/api/v1`, og start webappen med `npm run dev -- --host` |
| Web (`w`) | Ja, men tillatt | `http://localhost:5173/api/v1`. `cors.ts` i webappen svarer på preflight (OPTIONS) og tillater `Authorization`, men bare fra `http://localhost:8081`. Ikke testet i demo-api. |

## NB

Ikke kjør `npm run lint` i demo. `eslint` er ikke installert der, så `expo lint` installerer det selv med npm. Da endres `package.json` og lock-filene, og `node_modules` blir rotete.
