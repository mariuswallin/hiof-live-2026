# Oppgaver – navigasjon med Stack og Tabs

Kopi av `mobile/navigation`, men **uten skuff (Drawer) og modal**. Bare to navigatorer:

- **Tabs** – tab-bar nederst
- **Stack** – skjermer som legges oppå hverandre (med tilbake-knapp)
- **Detaljside** – dynamisk rute `[id]`, både inne i en tab og i en egen mappe utenfor tabs (`users/[userId]`)
- **Layout** – `_layout.tsx`-filer som bestemmer rammen rundt skjermene
- **Henting fra API** basert på id i URL-en – én gang med `useEffect`, én gang med TanStack Query

Alt annet (komponenter, contexter, API, tester) er det samme som i `mobile/navigation`.
Se [Forskjeller fra `mobile/navigation`](#6-forskjeller-fra-mobilenavigation).

## Kom i gang

```bash
pnpm install
pnpm start        # trykk i (iOS), a (Android) eller w (web)
```

---

## 1. Grunnideen: filer = skjermer

Expo Router bygger navigasjonen fra **mappestrukturen i `src/app/`**. Hver fil er en
skjerm, og filstien er URL-en.

| Konvensjon     | Betyr                                                 | Eksempel                         |
| -------------- | ----------------------------------------------------- | -------------------------------- |
| `fil.tsx`      | En skjerm                                             | `profile.tsx` → `/profile`       |
| `index.tsx`    | Standardskjermen i en mappe                           | `tasks/index.tsx` → `/tasks`     |
| `_layout.tsx`  | **Navigatoren** for mappen (Stack, Tabs)              | `(tabs)/_layout.tsx`             |
| `(gruppe)/`    | Organiserer filer, blir **ikke** del av URL-en        | `(tabs)/index.tsx` → `/`         |
| `[param].tsx`  | Dynamisk segment, leses med `useLocalSearchParams`    | `tasks/[id].tsx` → `/tasks/3`    |
| `+not-found`   | Vises når ingen fil matcher URL-en                    |                                  |

## 2. Hvordan navigatorene er nøstet

```
Stack                      (src/app/_layout.tsx)
├── Tabs                   (src/app/(tabs)/_layout.tsx)
│   ├── Hjem               /
│   ├── Oppgaver           → Stack (tasks/_layout.tsx)
│   │     ├── liste         /tasks
│   │     ├── detalj        /tasks/3
│   │     └── eier          /tasks/user/68
│   └── Profil             /profile
├── Ny oppgave             /new-task
├── Innstillinger          /settings
├── Om appen               /about
├── Brukere                → Stack (users/_layout.tsx)
│     ├── liste             /users
│     └── bruker            /users/68
└── Admin (beskyttet)      /admin      kun role: "admin"
```

Tommelfingerregel: **det som ligger ytterst, dekker det som ligger under.**
Derfor dekker «Ny oppgave», «Innstillinger», «Om appen» og «Brukere» tab-baren (de
ligger i rot-Stacken), mens detaljsiden ligger inne i Oppgaver-taben (tab-baren blir
stående).

`tasks/` og `users/` er **samme mønster** (mappe med egen Stack: liste → `[param]`) –
den ene inne i en tab, den andre utenfor.

---

## 3. Alle filene

### `src/app/` – rutene

| Fil | Hva den gjør | Nøkkelbegreper |
| --- | --- | --- |
| `_layout.tsx` | Rot-Stack. Pakker hele appen i providers (`QueryClientProvider`, `AuthProvider`, `TasksProvider`). `RootNavigator` viser «Henter bruker …» til rollen er kjent, og beskytter `admin` med `Stack.Protected`. Registrerer `(tabs)` og `users` uten header, og `new-task`, `settings` og `about` som vanlige Stack-skjermer. `initialRouteName: "(tabs)"` legger tabs under når en skjerm utenfor tabs åpnes direkte. | `Stack`, providers over navigatoren, `unstable_settings` |
| `new-task.tsx` | Vanlig Stack-skjerm som bruker `TaskRegister` (samme skjema som i hiof-live-2026). Validerer tittelen med zod, kaller `add()` og går tilbake med `router.back()`. | Stack-skjerm utenfor tabs, `router.back()`, context |
| `settings.tsx` | Skjerm i rot-Stacken, utenfor `(tabs)/` – derfor ingen tab-bar, men tilbake-knapp. | skjerm utenfor tabs |
| `about.tsx` | Enda en skjerm utenfor tabs. | |
| `admin.tsx` | **Beskyttet** skjerm, kun for admin. Ligger i rot-Stacken, så den kan åpnes fra hvor som helst. Beskyttes av `<Stack.Protected guard={isAdmin}>` i `_layout.tsx` – skjermen sjekker ikke rollen selv. Knapp som bytter til vanlig bruker viser at man kastes ut. | `Stack.Protected`, `guard` |
| `+not-found.tsx` | Fallback for ukjente URL-er, med lenke til `/`. | `+not-found` |
| `users/_layout.tsx` | Stack for en mappe **utenfor tabs** – samme mønster som `tasks/_layout.tsx`. `initialRouteName: "index"` legger lista under når `/users/68` åpnes direkte. | Stack utenfor tabs, nøstet Stack |
| `users/index.tsx` | Lista over brukere (`/users`), hentet med `useQuery` (`fetchUsers`). Hver rad er en `UserItem`. | `useQuery`, `FlatList` |
| `users/[userId].tsx` | **Dynamisk rute utenfor tabs.** Henter brukeren med samme `queryKey` som `tasks/user/[userId].tsx` (delt cache). «Neste bruker» åpner samme fil med ny parameter (`Link push`). | `useLocalSearchParams`, `Number(param)`, `push` || `(tabs)/_layout.tsx` | Tab-baren: Hjem, Oppgaver, Profil. Ikoner og badge med antall åpne oppgaver. | `Tabs`, `tabBarIcon`, `tabBarBadge` |
| `(tabs)/index.tsx` | Hjem (`/`). Hilser på innlogget bruker (`useAuth()`), viser status og **alle måtene å navigere på**: `Link` til annen tab, rett inn på `/tasks/3`, lenke til skjerm utenfor tabs, `router.push` til «Ny oppgave», lenker til `/users` og rett til `/users/68`. | `Link`, `router.push/replace/back` |
| `(tabs)/profile.tsx` | Enkel tab uten egen Stack. Viser innlogget bruker fra `useAuth()`, knapp som henter brukeren på nytt, lenker til `/settings` og `/about`. | tab uten stack, `useAuth()` |
| `(tabs)/tasks/_layout.tsx` | Stack **inne i** Oppgaver-taben. Tilbake-knapp på alt over lista. `initialRouteName: "index"` sørger for at lista alltid ligger under detaljsiden. | Stack i tab, `unstable_settings` |
| `(tabs)/tasks/index.tsx` | Lista: `<TaskList tasks={tasks} onToggle={toggle} />`, som i demoens `index.tsx`. Legger til `+` i headeren med `<Stack.Screen options>` fra selve skjermen. | skjerm styrer egen header |
| `(tabs)/tasks/[id].tsx` | **Detaljsiden.** Leser `id` fra URL-en, slår opp oppgaven i context, dynamisk tittel, fullfør/slett. `RemoteTodo` henter `dummyjson.com/todos/:id` med **`useEffect`**, viser et bilde bygget fra svaret, og sender `userId` videre med en `Link`. | `useLocalSearchParams`, `useEffect`, `AbortController`, `key`, `Image` |
| `(tabs)/tasks/user/[userId].tsx` | Tredje nivå i stacken. Henter `dummyjson.com/users/:userId` med **TanStack Query**. Kommentaren øverst sammenligner med `useEffect`. Viser brukeren med `UserInfo`. | `useQuery`, `queryKey`, cache |

### `src/components/` – gjenbrukbare byggeklosser

Samme mapper og filnavn som i `mobile/demo` og `mobile/navigation` (`tasks/` og
`shared/`), så komponentene er lette å kjenne igjen.

| Fil | Hva den gjør |
| --- | --- |
| `tasks/TaskItem.tsx` | Samme rad og props (`task`, `onToggle`) som i demoen, pluss `>` til høyre. Hele raden er en `<Link asChild>` til detaljsiden, avkrysningsboksen er en egen `Pressable` som bare toggler. |
| `tasks/TaskList.tsx` | Samme navn og props som i demoen (minus `onRegister`). `FlatList` i stedet for `.map`, og `TaskRegister` er flyttet ut til `new-task.tsx`. |
| `tasks/TaskRegister.tsx` | `TaskRegister` fra demoen («Du skrev …», «Register Task», `onRegister`). Nytt: valgfri `error`-prop. |
| `shared/Empty.tsx` | Tom-/feiltilstand fra demoen. `onPress` er valgfri her (+ `actionLabel`). |
| `shared/Loading.tsx` | Laster-tilstand (uendret fra demoen). |
| `shared/Screen.tsx` | Enkel ramme (ScrollView + padding). Erstatter `TaskLayout` fra demoen – headeren tegnes nå av navigatoren. |
| `shared/Card.tsx` | Hvit boks med overskrift, deler skjermene i seksjoner. |
| `shared/Button.tsx` | Blå/rød knapp med full bredde (`label`, `onPress`, `danger`, `disabled`). |
| `shared/Icon.tsx` | Wrapper rundt `SymbolView`: SF Symbols på iOS, Material Symbols på Android/web. |
| `users/UserInfo.tsx` | Bilde, navn, e-post og id for én bruker. Brukes av `tasks/user/[userId]`, `users/[userId]` og `UserItem` – samme visning tre steder i rutetreet. |
| `users/UserItem.tsx` | Én rad i `/users`. Samme oppbygning som `TaskItem`: `<Link asChild>` + `>` til høyre. |

### Øvrige mapper

| Fil | Hva den gjør |
| --- | --- |
| `contexts/TasksContext.tsx` | Samme `TasksProvider` + `useTasks()` som i demoen (`toggle`, `add(task)`), pluss `remove`. **Henter oppgavene fra `dummyjson.com/todos` med `useEffect`** (fetch → `response.ok` → JSON → zod → `Todo` til `Task`), med `isLoading`/`error`. Nå nødvendig: skjermene lages av ruteren og **kan ikke få props**. |
| `contexts/AuthContext.tsx` | `AuthProvider` + `useAuth()`: `user`, `isLoading`, `isAdmin`, `reload`, `loginAs(role)`. Henter innlogget bruker **ved hver oppstart/refresh** og legger den i context. Kommentaren øverst forklarer hvor lenge brukeren «lever». |
| `api/auth.ts` | `AuthUserSchema` (bruker + `role: "admin" \| "user"`). `fetchCurrentUser()` – **simulert** `GET /me` (800 ms, validert med zod). To kontoer: Ola (`user`, standard) og Kari (`admin`). `simulateLogin(role)` bytter konto. Logger `[auth] Henter …` så man ser *når* den kjører. |
| `api/dummy-json.ts` | Zod-skjemaer (`TodoSchema`, `TodosResponseSchema`, `UserSchema`, `UsersResponseSchema`), `fetchTodo(id)`, `fetchUser(id)` og `fetchUsers()`. Sjekker `response.ok` (fetch kaster ikke ved 404) og validerer svaret med zod. Tar imot `signal` så forespørselen kan avbrytes. |
| `constants/theme.ts` | Farger, avstander, radius, skriftstørrelser (samme som demoen). |
| `utils/task-schema.ts` | Demoens `TaskSchema` (+ `trim()` og norske feilmeldinger) og `NewTaskSchema` (= alt unntatt `id`). |

### Konfig

| Fil | Hva |
| --- | --- |
| `app.json` | `scheme: "navigation-stack-tabs"` (dyplenker), `typedRoutes: true` (TypeScript sjekker at `href` finnes). |
| `package.json` | Som `mobile/navigation`. |
| `playwright.config.ts` | Port 8083 (navigation bruker 8082), så e2e aldri gjenbruker serveren til feil app. |

---

## 4. Steg for steg – forslag til gjennomgang

**Steg 1 – Layout og filbasert routing**
Åpne `src/app/_layout.tsx`. Kommentaren øverst viser hele treet. Forklar `_layout`,
`(gruppe)` og `[param]`. Vis at providers ligger *over* `<Stack>`.

**Steg 2 – Tabs**
`(tabs)/_layout.tsx`. Ikoner, rekkefølge, badge. Spørsmålet «hvem eier headeren?»:
rot-Stacken skjuler sin for `(tabs)`, tabs viser sin – ellers får vi to headere.

**Steg 3 – Stack inne i en tab**
`tasks/_layout.tsx` og `tasks/index.tsx`. Oppgaver-taben har `headerShown: false` fordi
Stacken har egen header. Vis `+` i headeren (skjermen styrer egen header).

**Steg 4 – Lenke til detaljside**
`components/tasks/TaskItem.tsx`: `href={{ pathname: "/tasks/[id]", params: { id } }}` og
`asChild`. Trykk på raden → detalj. Trykk på boksen → bare toggle.

**Steg 5 – Detaljside + `useEffect`**
`tasks/[id].tsx`: `useLocalSearchParams`, dynamisk tittel, `router.back()` ved slett.
Gå gjennom `RemoteTodo`: `useState` for data og feil (laster = ingen av delene ennå), `AbortController`, opprydding, `key={id}`.

**Steg 6 – Videre i stacken + TanStack Query**
Trykk «Se hvem som eier den» → `user/[userId].tsx`. Sammenlign tabellen i kommentaren.
Gå tilbake og inn igjen: data vises med en gang (cache).

**Steg 7 – Skjermer utenfor tabs + delt state + henting i context**
`+` → `new-task.tsx`. Samme `TaskRegister` som før – bare lagt i en egen Stack-skjerm som
går tilbake etterpå. Tab-baren er borte, fordi skjermen ligger i rot-Stacken. Legg til en
oppgave → lista og badgen oppdateres. Profil → Innstillinger/Om appen: samme prinsipp.
Forklar `contexts/TasksContext.tsx`: `useEffect` henter lista fra dummyjson ved oppstart –
gå gjennom steg 1–5 i kommentarene. Åpne den nye oppgaven: API gir 404 → feil-tilstand.

**Steg 8 – Navigere på tvers**
Hjem-taben: `Link` til annen tab, rett til `/tasks/3` (tilbake virker takket være
`initialRouteName`), `Link` til skjerm utenfor tabs, `router.push` fra kode.

**Steg 9 – Mappe med dynamisk rute utenfor tabs**
`users/_layout.tsx`, `users/index.tsx`, `users/[userId].tsx`. Samme mønster som `tasks/`,
men i rot-Stacken: ingen tab-bar. Skriv `/users/68` i adressefeltet – ingen tab er
involvert, og «tilbake» går likevel til lista (`initialRouteName`). «Neste bruker» åpner
samme fil med ny parameter. Åpne eieren av oppgave 3 først → `/users/68` vises med en gang
(samme `queryKey`).

**Steg 10 – Innlogget bruker i context**
`contexts/AuthContext.tsx`: les livsløpet i kommentaren. Start appen og se
`[auth] Henter innlogget bruker` i konsollen – én gang. Bytt tab, åpne detalj og
«Ny oppgave»: ingen ny henting. Refresh (F5 / «r» i Metro): borte fra minnet → hentes
på nytt. «Hent bruker på nytt» på Profil simulerer det samme.

**Steg 11 – Rolle og beskyttet rute**
`_layout.tsx`: `<Stack.Protected guard={isAdmin}>` rundt `admin`. Som Ola (`user`): ingen
lenke på Hjem, og `/admin` i adressefeltet → sendes til `/`. Profil → «Logg inn som admin»
→ lenken dukker opp → åpne `/admin` → «Bytt til vanlig bruker» → kastes ut. Poeng: å skjule
lenken er ikke beskyttelse, og `Stack.Protected` beskytter bare skjermen – API-et må selv
sjekke rollen.

Mer detaljert gjennomgang med «Prøv» og spørsmål per steg: se `STEPS.md`.

---

## 5. Forskjeller fra `mobile/demo`

| Demo | Navigasjon (Stack + Tabs) |
| --- | --- |
| Én skjerm (`index.tsx`) | Mange skjermer i et rutetre |
| `TasksContext` var valgfritt (alt på én skjerm) | `TasksContext` er nødvendig (skjermer kan ikke få props) |
| `TaskList` med `TaskRegister` inni, `.map` | `TaskList` med `FlatList`, `TaskRegister` på egen skjerm |
| `TaskItem`: hele raden toggler | `TaskItem`: raden er en `Link`, boksen toggler |
| `TaskLayout` tegner header | Navigatoren tegner header og tab-bar |
| `useState(TASKS)` – data fra lokal konstant | `useState([])` + `useEffect` – lista hentes fra API i `TasksContext`. Også `useQuery` og innlogget bruker med rolle (`AuthContext`) |
| Ingen tilgangsstyring | `/admin` beskyttet med `Stack.Protected` |

## 6. Forskjeller fra `mobile/navigation`

| `mobile/navigation` | `mobile/navigation-stack-tabs` |
| --- | --- |
| `(drawer)/(tabs)/…` | `(tabs)/…` – én gruppe mindre, samme URL-er |
| `(drawer)/settings.tsx`, `(drawer)/about.tsx` – bare i skuffen | `settings.tsx`, `about.tsx` i rot-Stacken. Nås med lenker fra Profil og Hjem |
| `new-task` med `presentation: "modal"` | `new-task` som vanlig Stack-skjerm (glir inn fra siden, tilbake-knapp) |
| ☰ (`DrawerToggleButton`) i tabs- og tasks-headeren | Ingen – tasks-lista er rot i sin Stack, resten får tilbake-knapp |
| `GestureHandlerRootView` rundt appen (sveip for skuffen) | Ikke nødvendig – fjernet |
| `listeners` → `drawerItemPress` for «Oppgaver» i skuffen | Finnes ikke |
| – | Ny mappe `users/` i rot-Stacken: liste + dynamisk `[userId]` utenfor tabs |
| `tasks/user/[userId].tsx` tegner brukeren selv | Bruker `components/users/UserInfo` (delt med `users/`) |
| Ingen `unstable_settings` i rot-layouten | `initialRouteName: "(tabs)"` – dyplenker til skjermer utenfor tabs får «tilbake» |
| `scheme: "navigation"`, e2e på port 8082 | `scheme: "navigation-stack-tabs"`, e2e på port 8083 |

Resten av komponentene, contextene, API-koden og testene er de samme. E2E har to tester
til: «Ny oppgave» legges oppå tabs, og `/users/68` åpnes direkte uten tabs.

---

## 7. Spørsmål som kan dukke opp

### Routing og struktur

**Hvorfor filbasert routing i stedet for å definere rutene i kode?**
Mappene *er* URL-ene, så du ser strukturen i filtreet. Du får dyplenker og web-URL-er
gratis, og med `typedRoutes` sier TypeScript ifra hvis en `href` peker på en rute som
ikke finnes. Under panseret er det fortsatt React Navigation.

**Hva er forskjellen på `(tabs)` og `tasks`?**
Parentes = gruppe, kun for organisering – ikke med i URL-en. `tasks/` uten parentes blir
`/tasks`. Derfor er `(tabs)/index.tsx` bare `/`.

**Hvorfor kan jeg ikke legge komponenter i `app/`?**
Alt i `app/` blir en rute. En `TaskItem.tsx` der ville blitt en skjerm på `/TaskItem`.
Derfor ligger gjenbrukbare komponenter i `src/components/`.

**Må jeg liste opp alle skjermene i `_layout.tsx`?**
Nei. Filer som ikke er listet opp kommer med automatisk, men med standardtittel og i
alfabetisk rekkefølge. Vi lister dem opp for å styre rekkefølge, titler og ikoner.

**Hva skjer hvis appen ikke har en `/`-rute?**
Appen vet ikke hva den skal vise ved oppstart, og du havner på `+not-found`. Her er `/`
Hjem-taben.

### Stack og Tabs

**Når bruker jeg Stack eller Tabs?**
- **Tabs**: 3–5 hovedområder brukeren bytter mellom hele tiden.
- **Stack**: dybde – liste → detalj → mer detalj. Tilbake-knapp.

(Drawer er et tredje alternativ for mange eller sjeldnere brukte valg – se `mobile/navigation`.)

**Hvorfor har Oppgaver-taben sin egen Stack, men ikke Profil?**
Oppgaver trenger flere nivåer (liste → detalj → eier). Profil er én skjerm, så en Stack
ville vært unødvendig.

**Hvorfor blir tab-baren stående på detaljsiden, men ikke på «Ny oppgave»?**
Detaljsiden ligger *inne i* tabs (i Oppgaver-stacken). «Ny oppgave» ligger i rot-Stacken,
*utenfor* tabs, og legges derfor oppå hele tab-navigatoren. Det samme gjelder
Innstillinger, Om appen og Admin.

**Hvor bør en skjerm ligge – i en tab-stack eller i rot-Stacken?**
Spør: skal tab-baren være synlig? Detaljer som hører til én tab (oppgave, eier) legges i
tabens Stack. Skjermer som er en «egen oppgave» (skjema, innstillinger, admin) legges i
rot-Stacken, så de kan åpnes fra alle tabs og har fokus.

**Hvorfor fikk jeg to headere oppå hverandre?**
Hver navigator tegner sin egen header. Når de er nøstet, må du velge hvem som viser den:
`headerShown: false` på det ytre nivået. Se `_layout.tsx` (`(tabs)` og `users`) og
`(tabs)/_layout.tsx` (`tasks`).

**Hvorfor har `users/` sin egen `_layout.tsx`?**
For å få samme oppførsel som `tasks/`: `initialRouteName` legger lista under når
`/users/68` åpnes direkte. Uten egen layout ville `users/index` og `users/[userId]` blitt
to løse skjermer i rot-Stacken – det virker også, men da finnes det ingen liste å gå
tilbake til fra en dyplenke.

**Hvorfor får lista på `/users` en tilbake-knapp når den er nederst i sin Stack?**
`users`-Stacken er nøstet i rot-Stacken. Den første skjermen arver «tilbake» fra
forelderen – så den går tilbake dit du kom fra (f.eks. Hjem).

**Husker tabs hvor jeg var?**
Ja. Alle tabs lever samtidig. Bytter du tab midt i en detaljside og kommer tilbake, ligger
du fortsatt på detaljsiden.

### Navigere og sende data

**`<Link>` eller `router.push()`?**
`Link` når brukeren trykker på noe (bedre for tilgjengelighet og web – blir en ekte
`<a>`). `router` når navigasjonen skjer som *resultat* av noe: etter lagring, innlogging,
en timer osv.

**Forskjellen på `push`, `replace`, `back` og `navigate`?**
- `push` – legg ny skjerm oppå, kan gå tilbake.
- `replace` – bytt ut nåværende, kan *ikke* gå tilbake (typisk etter innlogging).
- `back` – ett steg tilbake.
- `navigate` – gå til ruten; finnes den allerede i stacken, gå dit i stedet for å
  legge en ny oppå.

**Hvorfor sender vi bare `id`, ikke hele oppgaven?**
- URL-parametere er alltid **strenger** – objekter må serialiseres.
- URL-en skal være nok til å åpne skjermen (dyplenke, web-refresh, deling).
- Detaljsiden slår opp i context, og viser derfor alltid oppdaterte data.

**Hvorfor er `id` en streng når den ser ut som et tall?**
Alt fra URL-en er tekst. Trenger du et tall: `Number(id)`, gjerne validert med zod.

**`useLocalSearchParams` eller `useGlobalSearchParams`?**
Local gir parametere for *denne* skjermen og oppdateres bare når den er i fokus. Global
oppdateres ved hver URL-endring – også for skjermer i bakgrunnen. Nesten alltid: Local.

**Hvordan sender jeg data *tilbake* fra «Ny oppgave»?**
Ikke via navigasjonen. Oppdater delt state (her `add()` i context) og gå tilbake –
skjermen under leser samme state og oppdateres selv.

**Hva gjør `initialRouteName` / `unstable_settings`?**
Hopper du rett til `/tasks/3` fra Hjem eller en dyplenke, inneholder stacken bare
detaljsiden. `initialRouteName: "index"` legger lista under, så «tilbake» virker. Samme i
`users/_layout.tsx`, og i rot-layouten (`"(tabs)"`), så en dyplenke til `/users/68` eller
`/settings` har Hjem under seg.

**Hvorfor står det `/users?userId=68` etter at jeg gikk tilbake til lista?**
Skjermen som `initialRouteName` legger under, får samme parametere som skjermen du åpnet.
Ufarlig her – lista bryr seg ikke om `userId`.

**Hvorfor `push` på «Neste bruker»?**
Lenken går til samme fil (`[userId].tsx`) med en annen parameter. `push` sier eksplisitt
«legg en ny skjerm oppå» – da går «tilbake» til forrige bruker. Med `replace` ville den
byttet ut den nåværende.

**Hvorfor vises `/users/68` med en gang etter at jeg har sett eieren av oppgave 3?**
Begge skjermene bruker `queryKey: ["user", userId]`. Cachen bryr seg ikke om hvor i
rutetreet skjermen ligger – samme nøkkel, samme data.

**Hvordan åpner jeg en dyplenke?**
Med `pnpm start` kjørende:

| Hvor | Kommando |
| --- | --- |
| Web | Skriv `http://localhost:8081/tasks/3` i adressefeltet |
| iOS simulator (Expo Go) | `npx uri-scheme open "exp://127.0.0.1:8081/--/tasks/3" --ios` |
| Android emulator (Expo Go) | `npx uri-scheme open "exp://10.0.2.2:8081/--/tasks/3" --android` |
| Development build / ferdig app | `npx uri-scheme open "navigation-stack-tabs://tasks/3" --ios` |

`/--/` skiller Metro-adressen fra app-ruten i Expo Go. Eget skjema
(`navigation-stack-tabs://`, fra `scheme` i `app.json`) er ikke registrert i Expo Go – det
virker først i en development build (`npx expo run:ios`). Bytt `tasks/3` med `finnes-ikke`
for å se `+not-found`. Fysisk telefon: bruk IP-en Metro viser i terminalen.

**Hvorfor to `Pressable` i `TaskItem.tsx`?**
Raden har to handlinger: trykk på raden → **naviger** til detalj, trykk på boksen →
**toggle** (bli på lista). Når to Pressable er nøstet, får den innerste trykket – så et
trykk på boksen navigerer ikke. Vil man ha det enklere: fjern den indre og la
toggling bare skje på detaljsiden.

### State

**Hvorfor Context og ikke bare props som i demoen?**
Skjermene rendres av ruteren – vi skriver aldri `<TaskDetail task={...} />`, og kan
derfor ikke gi dem props. Delt state må ligge *over* navigatoren.

**Blir ikke Context tregt?**
Alle som bruker `useTasks()` rendres på nytt når lista endres. For en liten app er det
helt greit. Med mye state kan man dele opp contexter eller bruke Zustand/Jotai.

**Forsvinner oppgavene når jeg lukker appen?**
Endringene, ja. Lista hentes fra API-et ved hver oppstart, men `toggle`/`add`/`remove`
endrer bare state i minnet – API-et vet ingenting. Skal endringer overleve, må de sendes
til API-et (POST/PATCH/DELETE) eller lagres lokalt (AsyncStorage/SQLite).

### Henting av data

**Hvorfor `useEffect` ett sted og TanStack Query et annet?**
For å vise begge. `useEffect` viser hva som faktisk skjer (og hvor mye man må huske selv).
TanStack Query viser hva man bruker i praksis.

**Hva gjør `AbortController`?**
Går brukeren tilbake før svaret kommer, avbrytes forespørselen. Uten den kan et gammelt
svar komme inn og sette state på en skjerm som ikke finnes – eller overskrive nyere data
hvis `id` har endret seg.

**Hvorfor `key={task.id}` på `RemoteTodo`?**
Ny `key` = React lager komponenten på nytt med tom state. Da slipper vi å nullstille
`todo`/`error` manuelt inne i effekten (som lint-regelen advarer mot).

**Hvorfor kjører effekten to ganger i dev?**
React Strict Mode kjører effekter to ganger i utvikling for å avsløre manglende
opprydding. Med `AbortController` avbrytes den første – i produksjon skjer det én gang.

**Hvorfor sjekker vi `response.ok`?**
`fetch` kaster bare ved nettverksfeil. En 404 eller 500 er et «vellykket» svar, så vi må
sjekke status selv.

**Hvorfor zod på API-svaret?**
TypeScript-typer finnes ikke når koden kjører. Endrer API-et seg, feiler det tidlig og
tydelig i stedet for `undefined` langt ute i UI-et.

**Hvorfor vises ikke bildet mitt?**
Bilder i React Native har ingen størrelse av seg selv. Et bilde fra nett uten
`width`/`height` (eller `aspectRatio`) blir 0×0. Lokale bilder bruker
`require("@/assets/…")`, bilder fra nett en URL-streng.

**`Image` fra react-native eller `expo-image`?**
Begge virker. `expo-image` cacher på disk, har `contentFit` (som `object-fit`) og
`transition`, og støtter flere formater. Derfor bruker vi den.

**Hva er `queryKey`?**
Navnet på dataene i cachen. Alt `queryFn` avhenger av (her `userId`) må være med – ellers
deler to brukere samme cache-plass og du ser feil person.

**Hvorfor lastes eier-siden umiddelbart andre gang?**
Svaret ligger i cachen under `["user", userId]`. Query viser det med en gang og sjekker i
bakgrunnen om det er nytt.

**Hvorfor feiler API-kallet for en oppgave jeg la til selv?**
Nye oppgaver får `id` fra `Date.now()`, som ikke finnes i dummyjson → 404. Det er med
vilje, så man ser feil-tilstanden.

**Hvorfor lages `QueryClient` utenfor komponenten?**
Inne i komponenten ville den blitt laget på nytt ved hver render – med tom cache hver gang.

### Plattform

**Hvorfor ser det forskjellig ut på iOS og Android?**
Stack bruker native navigasjon, og hver plattform har sine egne animasjoner. Ikonene er
SF Symbols på iOS og Material Symbols på Android/web.

**Hvorfor en «Avbryt»-knapp på «Ny oppgave» når headeren har tilbake-knapp?**
Den gjør det samme som tilbake. Men i et skjema er en tydelig «Avbryt» vanlig – brukeren
ser at ingenting blir lagret.

**Hva med `NativeTabs`?**
Expo Router har også `NativeTabs` (ekte native tab-bar, «liquid glass» på iOS 26). Vi
bruker vanlige `Tabs` fordi de er like på alle plattformer og enklere å style – bra for
læring.

---

## 8. Tester

| Type | Fil | Verktøy | Kjør |
| --- | --- | --- | --- |
| Util | `src/utils/task-schema.test.ts` | Vitest | `pnpm test` |
| Komponent | `src/components/tasks/TaskRegister.test.tsx` | Vitest + vitest-native + Testing Library | `pnpm test` |
| E2E | `e2e/navigation.spec.ts` – liste → detalj → eier, «Ny oppgave» oppå tabs, `/users/68` direkte, feiltilstander | Playwright (web) | `pnpm e2e` |
| E2E | `e2e/auth.spec.ts` – brukeren hentes ved oppstart og refresh, ikke ved navigasjon | Playwright (web) | `pnpm e2e` |
| E2E | `e2e/admin.spec.ts` – vanlig bruker sendes bort fra `/admin`, admin kommer inn og kastes ut ved rollebytte | Playwright (web) | `pnpm e2e` |

`pnpm test:watch` kjører Vitest på nytt ved lagring, `pnpm e2e:ui` viser hvert steg i
Playwrights UI. Første gang e2e: `npx playwright install chromium`.

**Util-testen** kaller `NewTaskSchema` direkte: gyldig tittel, trimming, for kort
tittel, og at mellomrom ikke teller.

**Komponent-testen** rendrer `TaskRegister`, skriver i feltet (`fireEvent.changeText`),
trykker på knappen (`fireEvent.press`) og sjekker at `onRegister` ble kalt med riktig
tittel (`vi.fn()`).

**E2E-testen** starter Expo web, mocker `dummyjson.com` med `page.route`, og går gjennom
Hjem → Oppgaver-taben → `/tasks/3` → `/tasks/user/68` → tilbake → tilbake. En test åpner
`+` → `/new-task`, sjekker at tab-baren er borte, lagrer og havner tilbake på lista med
den nye oppgaven. En test åpner `/users/68` direkte (ingen tab-bar), går til neste bruker
med `push`, og tilbake to ganger til lista som `initialRouteName` la under. To tester lar
API-et svare 500 og sjekker feilmeldingene.

Oppsett:
- `vitest.config.mts` – `reactNative()` fra **vitest-native** kjører *ekte* React
  Native-JS i Node og mocker bare native-grensen. Samme `@/`-alias som tsconfig.
- `playwright.config.ts` – starter `expo start --web` selv (port 8083), mobil viewport.

### Spørsmål om testene

**Hvorfor Vitest og ikke Jest?**
Jest er standard i Expo-maler, men Vitest er raskere, bruker ESM, og er det samme
verktøyet som i webappen. `vitest-native` gjør at React Native-komponenter kan
testes uten Jest-presets og mock-filer.

**Hvorfor `await` foran `render` og `fireEvent`?**
Testing Library for React Native v14 er asynkron – den venter til React er ferdig med å
oppdatere før testen går videre.

**Hvorfor e2e på web og ikke på telefon?**
Expo Router gir web fra samme kode, så navigasjonsflyten er den samme. Playwright kjører
headless, er rask, og kan mocke nettverk med én linje. Ekte e2e på iOS/Android gjøres
med Maestro eller Detox – der er mocking av API mye tyngre.

**Hvordan vet jeg at mocken faktisk brukes?**
Teksten «Mocket todo fra testen» finnes bare i mocken. Hadde forespørselen gått til
dummyjson, ville testen feilet.

**Hvorfor tester vi ikke `TaskItem`?**
Den inneholder `<Link>`, og trenger derfor en ruter rundt seg. Det er e2e-testen som
dekker at lenken virker. `TaskRegister` er en ren komponent (props inn, callback ut),
og er derfor enklest å teste isolert.
