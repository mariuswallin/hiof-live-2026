# Oppgaver – navigasjon

Samme oppgave-app som `mobile/demo`, men med fokus på **navigasjon** med Expo Router:

- **Skuff** (Drawer) – meny som glir inn fra venstre
- **Tabs** – tab-bar nederst
- **Stack** – skjermer som legges oppå hverandre (med tilbake-knapp)
- **Detaljside** – dynamisk rute `[id]`
- **Modal** – skjerm som glir opp over alt annet
- **Layout** – `_layout.tsx`-filer som bestemmer rammen rundt skjermene
- **Henting fra API** basert på id i URL-en – én gang med `useEffect`, én gang med TanStack Query

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
| `_layout.tsx`  | **Navigatoren** for mappen (Stack, Tabs, Drawer)      | `(tabs)/_layout.tsx`             |
| `(gruppe)/`    | Organiserer filer, blir **ikke** del av URL-en        | `(drawer)/(tabs)/index.tsx` → `/`|
| `[param].tsx`  | Dynamisk segment, leses med `useLocalSearchParams`    | `tasks/[id].tsx` → `/tasks/3`    |
| `+not-found`   | Vises når ingen fil matcher URL-en                    |                                  |

## 2. Hvordan navigatorene er nøstet

```
Stack                      (src/app/_layout.tsx)
├── Drawer                 (src/app/(drawer)/_layout.tsx)
│   ├── Tabs               (src/app/(drawer)/(tabs)/_layout.tsx)
│   │   ├── Hjem           /
│   │   ├── Oppgaver       → Stack (tasks/_layout.tsx)
│   │   │     ├── liste     /tasks
│   │   │     ├── detalj    /tasks/3
│   │   │     └── eier      /tasks/user/68
│   │   └── Profil         /profile
│   ├── Innstillinger      /settings
│   └── Om appen           /about
└── Ny oppgave (modal)     /new-task
```

Tommelfingerregel: **det som ligger ytterst, dekker det som ligger under.**
Derfor ligger modalen i rot-Stacken (dekker både tabs og skuff), mens detaljsiden
ligger inne i Oppgaver-taben (tab-baren blir stående).

---

## 3. Alle filene

### `src/app/` – rutene

| Fil | Hva den gjør | Nøkkelbegreper |
| --- | --- | --- |
| `_layout.tsx` | Rot-Stack. Pakker hele appen i providers (`GestureHandlerRootView`, `QueryClientProvider`, `AuthProvider`, `TasksProvider`). Registrerer `(drawer)` uten header og `new-task` som modal. | `Stack`, `presentation: "modal"`, providers over navigatoren |
| `new-task.tsx` | Modal som bruker `TaskRegister` (samme skjema som i hiof-live-2026). Validerer tittelen med zod, kaller `add()` og lukker med `router.back()`. | modal, `router.back()`, context |
| `+not-found.tsx` | Fallback for ukjente URL-er, med lenke til `/`. | `+not-found` |
| `(drawer)/_layout.tsx` | Skuffen. Tre valg: Oppgaver (`(tabs)`), Innstillinger, Om appen. Skjuler sin egen header for `(tabs)` for å unngå dobbel header. «Oppgaver» bruker `listeners` → `drawerItemPress` for å gå rett til `/tasks`. | `Drawer`, `drawerIcon`, `headerShown: false`, `listeners` |
| `(drawer)/settings.tsx` | Skjerm som bare finnes i skuffen – derfor ingen tab-bar. Bruker skuffens header. | skjerm utenfor tabs |
| `(drawer)/about.tsx` | Enda en skuff-skjerm. | |
| `(drawer)/(tabs)/_layout.tsx` | Tab-baren: Hjem, Oppgaver, Profil. Ikoner, badge med antall åpne oppgaver, ☰-knapp i headeren. | `Tabs`, `tabBarIcon`, `tabBarBadge`, `DrawerToggleButton` |
| `(drawer)/(tabs)/index.tsx` | Hjem (`/`). Hilser på innlogget bruker (`useAuth()`), viser status og **alle måtene å navigere på**: `Link` til annen tab, rett inn på `/tasks/3`, lenke til skuff-skjerm, `router.push` til modal. | `Link`, `router.push/replace/back` |
| `(drawer)/(tabs)/profile.tsx` | Enkel tab uten egen Stack. Viser innlogget bruker fra `useAuth()` (laster-tilstand til den er hentet), knapp som henter brukeren på nytt, lenke til `/settings`. | tab uten stack, `useAuth()` |
| `(drawer)/(tabs)/tasks/_layout.tsx` | Stack **inne i** Oppgaver-taben. ☰ på lista, tilbake-knapp på resten. `initialRouteName: "index"` sørger for at lista alltid ligger under detaljsiden. | Stack i tab, `unstable_settings` |
| `(drawer)/(tabs)/tasks/index.tsx` | Lista: `<TaskList tasks={tasks} onToggle={toggle} />`, som i demoens `index.tsx`. Legger til `+` i headeren med `<Stack.Screen options>` fra selve skjermen. | skjerm styrer egen header |
| `(drawer)/(tabs)/tasks/[id].tsx` | **Detaljsiden.** Leser `id` fra URL-en, slår opp oppgaven i context, dynamisk tittel, fullfør/slett. `RemoteTodo` henter `dummyjson.com/todos/:id` med **`useEffect`**, viser et bilde bygget fra svaret, og sender `userId` videre med en `Link`. | `useLocalSearchParams`, `useEffect`, `AbortController`, `key`, `Image` |
| `(drawer)/(tabs)/tasks/user/[userId].tsx` | Tredje nivå i stacken. Henter `dummyjson.com/users/:userId` med **TanStack Query**. Kommentaren øverst sammenligner med `useEffect`. | `useQuery`, `queryKey`, cache |

### `src/components/` – gjenbrukbare byggeklosser

Samme mapper og filnavn som i `mobile/demo` (`tasks/` og `shared/`), så komponentene
er lette å kjenne igjen.

| Fil | Hva den gjør |
| --- | --- |
| `tasks/TaskItem.tsx` | Samme rad og props (`task`, `onToggle`) som i demoen, pluss `>` til høyre. Hele raden er en `<Link asChild>` til detaljsiden, avkrysningsboksen er en egen `Pressable` som bare toggler. |
| `tasks/TaskList.tsx` | Samme navn og props som i demoen (minus `onRegister`). `FlatList` i stedet for `.map`, og `TaskRegister` er flyttet ut til modalen. |
| `tasks/TaskRegister.tsx` | `TaskRegister` fra demoen («Du skrev …», «Register Task», `onRegister`). Nytt: valgfri `error`-prop. |
| `shared/Empty.tsx` | Tom-/feiltilstand fra demoen. `onPress` er valgfri her (+ `actionLabel`). |
| `shared/Loading.tsx` | Laster-tilstand (uendret fra demoen). |
| `shared/Screen.tsx` | Enkel ramme (ScrollView + padding). Erstatter `TaskLayout` fra demoen – headeren tegnes nå av navigatoren. |
| `shared/Card.tsx` | Hvit boks med overskrift, deler skjermene i seksjoner. |
| `shared/Icon.tsx` | Wrapper rundt `SymbolView`: SF Symbols på iOS, Material Symbols på Android/web. |

### Øvrige mapper

| Fil | Hva den gjør |
| --- | --- |
| `contexts/TasksContext.tsx` | Samme `TasksProvider` + `useTasks()` som i demoen (`toggle`, `add(task)`), pluss `remove`. Nå nødvendig: skjermene lages av ruteren og **kan ikke få props**. |
| `contexts/AuthContext.tsx` | `AuthProvider` + `useAuth()`. Henter innlogget bruker **ved hver oppstart/refresh** og legger den i context. Kommentaren øverst forklarer hvor lenge brukeren «lever». |
| `api/auth.ts` | `fetchCurrentUser()` – **simulert** `GET /me` (800 ms forsinkelse, fast bruker, validert med zod). Logger `[auth] Henter …` så man ser *når* den kjører. |
| `api/dummy-json.ts` | `fetchTodo(id)` og `fetchUser(id)`. Sjekker `response.ok` (fetch kaster ikke ved 404) og validerer svaret med zod. Tar imot `signal` så forespørselen kan avbrytes. |
| `data/tasks.ts` | Testdata med id 1–8 – samme id-er finnes i dummyjson, så hver oppgave har en «tvilling» i API-et. |
| `constants/theme.ts` | Farger, avstander, radius, skriftstørrelser (samme som demoen). |
| `utils/task-schema.ts` | Demoens `TaskSchema` (+ `trim()` og norske feilmeldinger) og `NewTaskSchema` (= alt unntatt `id`). |

### Konfig

| Fil | Hva |
| --- | --- |
| `app.json` | `scheme: "navigation"` (dyplenker), `typedRoutes: true` (TypeScript sjekker at `href` finnes). |
| `package.json` | Som demoen, men uten `@tanstack/react-form`/FlashList og med `@tanstack/react-query`. |

---

## 4. Steg for steg – forslag til gjennomgang

**Steg 1 – Layout og filbasert routing**
Åpne `src/app/_layout.tsx`. Kommentaren øverst viser hele treet. Forklar `_layout`,
`(gruppe)` og `[param]`. Vis at providers ligger *over* `<Stack>`.

**Steg 2 – Skuffen**
`(drawer)/_layout.tsx`. Sveip fra venstre / trykk ☰. Åpne Innstillinger: ingen tab-bar,
fordi skjermen ligger utenfor `(tabs)/`.

**Steg 3 – Tabs**
`(tabs)/_layout.tsx`. Ikoner, rekkefølge, badge. Spørsmålet «hvem eier headeren?»:
skuffen skjuler sin, tabs viser sin med ☰ – ellers får vi to headere.

**Steg 4 – Stack inne i en tab**
`tasks/_layout.tsx` og `tasks/index.tsx`. Oppgaver-taben har `headerShown: false` fordi
Stacken har egen header. Vis `+` i headeren (skjermen styrer egen header).

**Steg 5 – Lenke til detaljside**
`components/tasks/TaskItem.tsx`: `href={{ pathname: "/tasks/[id]", params: { id } }}` og
`asChild`. Trykk på raden → detalj. Trykk på boksen → bare toggle.

**Steg 6 – Detaljside + `useEffect`**
`tasks/[id].tsx`: `useLocalSearchParams`, dynamisk tittel, `router.back()` ved slett.
Gå gjennom `RemoteTodo`: `useState` for data og feil (laster = ingen av delene ennå), `AbortController`, opprydding, `key={id}`.

**Steg 7 – Videre i stacken + TanStack Query**
Trykk «Se hvem som eier den» → `user/[userId].tsx`. Sammenlign tabellen i kommentaren.
Gå tilbake og inn igjen: data vises med en gang (cache).

**Steg 8 – Modal + delt state**
`+` → `new-task.tsx`. Samme `TaskRegister` som før – bare lagt i en modal som lukkes etterpå. Legg til en oppgave → lista og badgen oppdateres. Forklar
`contexts/TasksContext.tsx`. Åpne den nye oppgaven: API gir 404 → feil-tilstand.

**Steg 9 – Navigere på tvers**
Hjem-taben: `Link` til annen tab, rett til `/tasks/3` (tilbake virker takket være
`initialRouteName`), `router.push` fra kode.

**Steg 10 – Innlogget bruker i context**
`contexts/AuthContext.tsx`: les livsløpet i kommentaren. Start appen og se
`[auth] Henter innlogget bruker` i konsollen – én gang. Bytt tab, åpne detalj og modal:
ingen ny henting. Refresh (F5 / «r» i Metro): borte fra minnet → hentes på nytt.
«Hent bruker på nytt» på Profil simulerer det samme.

---

## 5. Forskjeller fra `mobile/demo`

| Demo | Navigasjon |
| --- | --- |
| Én skjerm (`index.tsx`) | Mange skjermer i et rutetre |
| `TasksContext` var valgfritt (alt på én skjerm) | `TasksContext` er nødvendig (skjermer kan ikke få props) |
| `TaskList` med `TaskRegister` inni, `.map` | `TaskList` med `FlatList`, `TaskRegister` i egen modal |
| `TaskItem`: hele raden toggler | `TaskItem`: raden er en `Link`, boksen toggler |
| `TaskLayout` tegner header | Navigatoren tegner header og tab-bar |
| Data fra lokal konstant | Også data fra API (`useEffect`, `useQuery`) og innlogget bruker (`AuthContext`) |

---

## 6. Spørsmål som kan dukke opp

### Routing og struktur

**Hvorfor filbasert routing i stedet for å definere rutene i kode?**
Mappene *er* URL-ene, så du ser strukturen i filtreet. Du får dyplenker og web-URL-er
gratis, og med `typedRoutes` sier TypeScript ifra hvis en `href` peker på en rute som
ikke finnes. Under panseret er det fortsatt React Navigation.

**Hva er forskjellen på `(tabs)` og `tasks`?**
Parentes = gruppe, kun for organisering – ikke med i URL-en. `tasks/` uten parentes blir
`/tasks`. Derfor er `(drawer)/(tabs)/index.tsx` bare `/`.

**Hvorfor kan jeg ikke legge komponenter i `app/`?**
Alt i `app/` blir en rute. En `TaskItem.tsx` der ville blitt en skjerm på `/TaskItem`.
Derfor ligger gjenbrukbare komponenter i `src/components/`.

**Må jeg liste opp alle skjermene i `_layout.tsx`?**
Nei. Filer som ikke er listet opp kommer med automatisk, men med standardtittel og i
alfabetisk rekkefølge. Vi lister dem opp for å styre rekkefølge, titler og ikoner.

**Hva skjer hvis appen ikke har en `/`-rute?**
Appen vet ikke hva den skal vise ved oppstart, og du havner på `+not-found`. Her er `/`
Hjem-taben.

### Stack, Tabs og Drawer

**Når bruker jeg Stack, Tabs eller Drawer?**
- **Tabs**: 3–5 hovedområder brukeren bytter mellom hele tiden.
- **Stack**: dybde – liste → detalj → mer detalj. Tilbake-knapp.
- **Drawer**: mange eller sjeldnere brukte valg (innstillinger, om, logg ut).
  Mindre vanlig på iOS enn Android.

**Hvorfor har Oppgaver-taben sin egen Stack, men ikke Profil?**
Oppgaver trenger flere nivåer (liste → detalj → eier). Profil er én skjerm, så en Stack
ville vært unødvendig.

**Hvorfor blir tab-baren stående på detaljsiden, men ikke i modalen?**
Detaljsiden ligger *inne i* tabs (i Oppgaver-stacken). Modalen ligger i rot-Stacken,
*utenfor* tabs, og legger seg derfor oppå alt.

**Hvorfor fikk jeg to headere oppå hverandre?**
Hver navigator tegner sin egen header. Når de er nøstet, må du velge hvem som viser den:
`headerShown: false` på det ytre nivået. Se `(drawer)/_layout.tsx` og
`(tabs)/_layout.tsx`.

**Husker tabs hvor jeg var?**
Ja. Alle tabs lever samtidig. Bytter du tab midt i en detaljside og kommer tilbake, ligger
du fortsatt på detaljsiden.

**Hvorfor trengs `listeners` på «Oppgaver» i skuffen?**
`(tabs)` er én skjerm for skuffen. Trykker du på den, havner du i taben du sist var i –
og står du allerede i `(tabs)`, lukker skuffen seg bare. Med `drawerItemPress` +
`preventDefault()` overstyrer vi og navigerer rett til `/tasks`.

**Hvorfor forsvinner ☰-knappen på detaljsiden?**
Stacken viser tilbake-knapp når det finnes noe å gå tilbake til. ☰ er bare satt på
`index` i `tasks/_layout.tsx`. Skuffen kan fortsatt åpnes med sveip.

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

**Hvordan sender jeg data *tilbake* fra modalen?**
Ikke via navigasjonen. Oppdater delt state (her `add()` i context) og lukk modalen –
skjermen under leser samme state og oppdateres selv.

**Hva gjør `initialRouteName` / `unstable_settings`?**
Hopper du rett til `/tasks/3` fra Hjem eller en dyplenke, inneholder stacken bare
detaljsiden. `initialRouteName: "index"` legger lista under, så «tilbake» virker.

**Hvordan åpner jeg en dyplenke?**
Med `pnpm start` kjørende:

| Hvor | Kommando |
| --- | --- |
| Web | Skriv `http://localhost:8081/tasks/3` i adressefeltet |
| iOS simulator (Expo Go) | `npx uri-scheme open "exp://127.0.0.1:8081/--/tasks/3" --ios` |
| Android emulator (Expo Go) | `npx uri-scheme open "exp://10.0.2.2:8081/--/tasks/3" --android` |
| Development build / ferdig app | `npx uri-scheme open "navigation://tasks/3" --ios` |

`/--/` skiller Metro-adressen fra app-ruten i Expo Go. Eget skjema (`navigation://`,
fra `scheme` i `app.json`) er ikke registrert i Expo Go – det virker først i en
development build (`npx expo run:ios`). Bytt `tasks/3` med `finnes-ikke` for å se
`+not-found`. Fysisk telefon: bruk IP-en Metro viser i terminalen.

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
Ja, alt ligger i minnet. Neste steg er AsyncStorage/SQLite lokalt, eller et API.

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
Stack bruker native navigasjon, og hver plattform har sine egne animasjoner og
modal-stiler. Ikonene er SF Symbols på iOS og Material Symbols på Android/web.

**Hvorfor en «Avbryt»-knapp i modalen?**
På iOS kan man dra modalen ned for å lukke den. Det finnes ikke på Android (der brukes
tilbake-knappen), så en synlig knapp er tryggest.

**Hva med `NativeTabs`?**
Expo Router har også `NativeTabs` (ekte native tab-bar, «liquid glass» på iOS 26). Vi
bruker vanlige `Tabs` fordi de er like på alle plattformer, fungerer i skuffen og er
enklere å style – bra for læring.

**Hvorfor `GestureHandlerRootView`?**
Skuffen åpnes med sveip, og Gesture Handler trenger en rot-komponent for å fange
bevegelsene.

---

## 7. Tester

| Type | Fil | Verktøy | Kjør |
| --- | --- | --- | --- |
| Util | `src/utils/task-schema.test.ts` | Vitest | `pnpm test` |
| Komponent | `src/components/tasks/TaskRegister.test.tsx` | Vitest + vitest-native + Testing Library | `pnpm test` |
| E2E | `e2e/navigation.spec.ts` | Playwright (web) | `pnpm e2e` |
| E2E | `e2e/auth.spec.ts` – brukeren hentes ved oppstart og refresh, ikke ved navigasjon | Playwright (web) | `pnpm e2e` |

`pnpm test:watch` kjører Vitest på nytt ved lagring, `pnpm e2e:ui` viser hvert steg i
Playwrights UI. Første gang e2e: `npx playwright install chromium`.

**Util-testen** kaller `NewTaskSchema` direkte: gyldig tittel, trimming, for kort
tittel, og at mellomrom ikke teller.

**Komponent-testen** rendrer `TaskRegister`, skriver i feltet (`fireEvent.changeText`),
trykker på knappen (`fireEvent.press`) og sjekker at `onRegister` ble kalt med riktig
tittel (`vi.fn()`).

**E2E-testen** starter Expo web, mocker `dummyjson.com` med `page.route`, og går gjennom
Hjem → Oppgaver-taben → `/tasks/3` → `/tasks/user/68` → tilbake → tilbake. En test til
lar API-et svare 500 og sjekker feilmeldingen.

Oppsett:
- `vitest.config.mts` – `reactNative()` fra **vitest-native** kjører *ekte* React
  Native-JS i Node og mocker bare native-grensen. Samme `@/`-alias som tsconfig.
- `playwright.config.ts` – starter `expo start --web` selv, mobil viewport.

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
