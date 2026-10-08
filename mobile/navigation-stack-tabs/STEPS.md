# Steg for steg – navigasjon med Stack og Tabs

Gjennomgang av `mobile/navigation-stack-tabs` – samme app som `mobile/navigation`, men
uten skuff (Drawer) og modal. Hvert steg har:

- **Mål** – hva man skal sitte igjen med
- **Filer** – hvor i koden vi er
- **Vis** – hva som gjennomgås, i rekkefølge
- **Prøv** – hva man gjør i appen for å se det virke
- **Spørsmål** – spørsmål som typisk dukker opp akkurat her, med svar

Se `README.md` for oversikt over alle filene.

---

## Steg 0 – Kom i gang

**Mål:** Appen kjører, og alle ser hele rutetreet før vi dykker ned.

```bash
pnpm install
pnpm start        # trykk i (iOS), a (Android) eller w (web)
```

**Vis**

1. Klikk raskt gjennom appen: Hjem → Oppgaver → en oppgave → «Se hvem som eier den» →
   tilbake → Profil → Innstillinger → tilbake → Om appen → tilbake → Oppgaver → `+` →
   tilbake → Hjem → «Brukere» → en bruker.
2. Vis treet – dette er kartet resten av gjennomgangen følger:

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

3. Tommelfingerregel: **det som ligger ytterst, dekker det som ligger under.**

**Prøv:** Start på web (`w`) og se at URL-en i adressefeltet endrer seg når du navigerer.

---

## Steg 1 – Layout og filbasert routing

**Mål:** Forstå at filer = skjermer, og at `_layout.tsx` er navigatoren for mappen sin.

**Filer:** `src/app/_layout.tsx`

**Vis**

1. Kommentaren øverst i fila viser hele treet.
2. Konvensjonene:

| Konvensjon    | Betyr                                              | Eksempel                       |
| ------------- | -------------------------------------------------- | ------------------------------ |
| `fil.tsx`     | En skjerm                                          | `profile.tsx` → `/profile`     |
| `index.tsx`   | Standardskjermen i en mappe                        | `tasks/index.tsx` → `/tasks`   |
| `_layout.tsx` | **Navigatoren** for mappen (Stack, Tabs)           | `(tabs)/_layout.tsx`           |
| `(gruppe)/`   | Organiserer filer, blir **ikke** del av URL-en     | `(tabs)/index.tsx` → `/`       |
| `[param].tsx` | Dynamisk segment, leses med `useLocalSearchParams` | `tasks/[id].tsx` → `/tasks/3`  |
| `+not-found`  | Vises når ingen fil matcher URL-en                 |                                |

3. Providers ligger **over** `<Stack>` – ellers når ikke skjermene dem:

```tsx
<QueryClientProvider client={queryClient}>
  <TasksProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="new-task" options={{ title: "Ny oppgave" }} />
      <Stack.Screen name="settings" options={{ title: "Innstillinger" }} />
      <Stack.Screen name="about" options={{ title: "Om appen" }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: "Oops" }} />
    </Stack>
  </TasksProvider>
</QueryClientProvider>
```

4. Hvorfor Stack helt ytterst: skjermene utenfor `(tabs)` skal legges oppå tab-baren.
5. `app.json`: `typedRoutes: true` gjør at TypeScript sjekker alle `href`.

**Prøv:** Endre en `href` til en rute som ikke finnes (f.eks. `/taskz`) – se at
TypeScript klager.

**Spørsmål**

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

**Hvorfor lages `QueryClient` utenfor komponenten?**
Inne i komponenten ville den blitt laget på nytt ved hver render – med tom cache hver gang.

**Når bruker jeg Stack eller Tabs?**
- **Tabs**: 3–5 hovedområder brukeren bytter mellom hele tiden.
- **Stack**: dybde – liste → detalj → mer detalj. Tilbake-knapp.

(Drawer er et tredje alternativ for mange eller sjeldnere brukte valg – se `mobile/navigation`.)

---

## Steg 2 – Tabs

**Mål:** Forstå tabs som søsken som lever samtidig, og hvem som eier headeren.

**Filer:** `src/app/(tabs)/_layout.tsx`, `src/app/_layout.tsx`

**Vis**

1. Rekkefølgen på `<Tabs.Screen>` = rekkefølgen i tab-baren.
2. `tabBarIcon` og `tabBarBadge` – badgen er antall åpne oppgaver, lest fra `useTasks()`.
   `undefined` = ingen badge.
3. «Hvem eier headeren?»: rot-Stacken skjuler sin for `(tabs)` (`headerShown: false` i
   `_layout.tsx`), tabs viser sin. Oppgaver-taben skjuler *sin* (`headerShown: false`)
   fordi Stacken inni har egen header.

**Prøv**

- Fullfør en oppgave → badgen teller ned.
- Fjern `headerShown: false` på `(tabs)` i `_layout.tsx` → to headere.
- Gå inn på en detaljside, bytt til Profil, og tilbake til Oppgaver → du står fortsatt
  på detaljsiden.

**Spørsmål**

**Hvorfor fikk jeg to headere oppå hverandre?**
Hver navigator tegner sin egen header. Når de er nøstet, må du velge hvem som viser den:
`headerShown: false` på det ytre nivået. Se `_layout.tsx` (`(tabs)`) og
`(tabs)/_layout.tsx` (`tasks`).

**Husker tabs hvor jeg var?**
Ja. Alle tabs lever samtidig. Bytter du tab midt i en detaljside og kommer tilbake, ligger
du fortsatt på detaljsiden.

**Hva med `NativeTabs`?**
Expo Router har også `NativeTabs` (ekte native tab-bar, «liquid glass» på iOS 26). Vi
bruker vanlige `Tabs` fordi de er like på alle plattformer og enklere å style – bra for
læring.

---

## Steg 3 – Stack inne i en tab

**Mål:** Dybde inne i én tab, uten at tab-baren forsvinner.

**Filer:** `(tabs)/tasks/_layout.tsx`, `(tabs)/tasks/index.tsx`, `(tabs)/profile.tsx`

**Vis**

1. `tasks/_layout.tsx` er en `Stack`: liste → detalj → eier.
2. Lista er rot i Stacken – de andre får tilbake-knapp automatisk.
3. `unstable_settings = { initialRouteName: "index" }` – kommer tilbake i steg 8.
4. `tasks/index.tsx`: **ingen props**, data fra `useTasks()` – samme linjer som demoens
   `index.tsx`: `<TaskList tasks={tasks} onToggle={toggle} />`. `TaskList` bruker nå
   `FlatList` (fyller skjermen, må scrolle), og `TaskRegister` er flyttet til
   `new-task.tsx`.
5. Skjermen styrer sin egen header med `<Stack.Screen options>`:

```tsx
<Stack.Screen
  options={{
    headerRight: () => (
      <Link href="/new-task" asChild>
        <Pressable accessibilityLabel="Ny oppgave"><Text>＋</Text></Pressable>
      </Link>
    ),
  }}
/>
```

6. Sammenlign med `profile.tsx`: én fil, ingen Stack.

**Prøv:** Gå liste → detalj → eier, og tilbake. Tab-baren står hele tiden.

**Spørsmål**

**Hvorfor har Oppgaver-taben sin egen Stack, men ikke Profil?**
Oppgaver trenger flere nivåer (liste → detalj → eier). Profil er én skjerm, så en Stack
ville vært unødvendig.

**Hvorfor har ikke lista en tilbake-knapp?**
Stacken viser tilbake-knapp bare når det finnes noe å gå tilbake til. Lista er nederst i
Oppgaver-stacken – det er tab-baren som tar deg videre derfra.

---

## Steg 4 – Lenke til detaljside

**Mål:** Navigere med `<Link>` og sende med en parameter.

**Filer:** `src/components/tasks/TaskItem.tsx`

**Vis**

1. Hele raden er en `Link`:

```tsx
<Link href={{ pathname: "/tasks/[id]", params: { id } }} asChild>
  <Pressable style={styles.container}>
    <Pressable onPress={() => onToggle(id)}>{/* avkrysningsboks */}</Pressable>
    <Text>{title}</Text>
    <Icon ios="chevron.right" android="chevron_right" />
  </Pressable>
</Link>
```

2. `href` som objekt: `pathname` med `[id]` som plassholder, `params` fyller inn.
3. `asChild` = «ikke lag din egen knapp, gi navigasjonen videre til barnet».
4. NB: vanlig `style`-objekt, ikke `style={({ pressed }) => …}` – en style-funksjon
   overlever ikke `asChild` på web.
5. Vi sender bare `id`, ikke hele oppgaven.

**Prøv:** Trykk på raden → detalj. Trykk på boksen → bare toggle, blir på lista.

**Spørsmål**

**`<Link>` eller `router.push()`?**
`Link` når brukeren trykker på noe (bedre for tilgjengelighet og web – blir en ekte
`<a>`). `router` når navigasjonen skjer som *resultat* av noe: etter lagring, innlogging,
en timer osv.

**Hvorfor sender vi bare `id`, ikke hele oppgaven?**
- URL-parametere er alltid **strenger** – objekter må serialiseres.
- URL-en skal være nok til å åpne skjermen (dyplenke, web-refresh, deling).
- Detaljsiden slår opp i context, og viser derfor alltid oppdaterte data.

**Hvorfor to `Pressable` i `TaskItem.tsx`?**
Raden har to handlinger: trykk på raden → **naviger** til detalj, trykk på boksen →
**toggle** (bli på lista). Når to Pressable er nøstet, får den innerste trykket – så et
trykk på boksen navigerer ikke. Vil man ha det enklere: fjern den indre og la
toggling bare skje på detaljsiden.

---

## Steg 5 – Detaljside og henting med `useEffect`

**Mål:** Lese parametere fra URL-en, og hente data manuelt – med alt man må huske selv.

**Filer:** `(tabs)/tasks/[id].tsx`, `src/api/dummy-json.ts`

**Vis – detaljsiden**

1. `const { id } = useLocalSearchParams<{ id: string }>();`
2. Slå opp oppgaven i context: `tasks.find((t) => t.id === id)`.
3. Finnes den ikke → egen tilstand med `router.back()`.
4. Dynamisk tittel: `<Stack.Screen options={{ title: task.title }} />`.
5. Slett → `remove(task.id)` + `router.back()`.

**Vis – `RemoteTodo`**

1. To `useState`: `todo` og `error`. Laster = ingen av delene ennå.
2. Effekten:

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetchTodo(id, controller.signal)
    .then(setTodo)
    .catch((e) => {
      if (controller.signal.aborted) return; // avbrudd er ikke en feil
      setError(e instanceof Error ? e.message : "Ukjent feil");
    });

  return () => controller.abort(); // opprydding
}, [id]);
```

3. `key={task.id}` på `<RemoteTodo>` – ny id = ny komponent med tom state.
4. `dummy-json.ts`: `response.ok`-sjekk og zod-validering i `getJson`.
5. Bildet: URL bygget fra svaret, `expo-image`, `aspectRatio: 2` gir størrelse.
6. `Link` videre med `userId` fra API-svaret (neste steg).

**Prøv**

- Toggle en oppgave i «Lokalt» → «Fra API» endres ikke. API-et vet ikke om lokale endringer.
- Fjern `aspectRatio` fra `styles.image` → bildet forsvinner.
- Slå av nettet / skru på flymodus → feil-tilstand.
- På web: legg en `console.log` i effekten og se at den kjører to ganger i dev.

**Spørsmål**

**Hvorfor er `id` en streng når den ser ut som et tall?**
Alt fra URL-en er tekst. Trenger du et tall: `Number(id)`, gjerne validert med zod.

**`useLocalSearchParams` eller `useGlobalSearchParams`?**
Local gir parametere for *denne* skjermen og oppdateres bare når den er i fokus. Global
oppdateres ved hver URL-endring – også for skjermer i bakgrunnen. Nesten alltid: Local.

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

---

## Steg 6 – Videre i stacken og TanStack Query

**Mål:** Tredje nivå i stacken, og samme type henting med et bibliotek.

**Filer:** `(tabs)/tasks/user/[userId].tsx`

**Vis**

1. `userId` kom fra API-svaret på detaljsiden, sendt med `Link`-params.
2. `useQuery`:

```tsx
const { data: user, isPending, error } = useQuery({
  queryKey: ["user", userId],
  queryFn: ({ signal }) => fetchUser(userId, signal),
});
```

3. Tabellen i kommentaren øverst:

| `useEffect`                 | `useQuery`                               |
| --------------------------- | ---------------------------------------- |
| `useState` for data + feil  | ferdig: `data`, `isPending`, `error`     |
| `AbortController` selv      | `signal` gis til `queryFn` automatisk    |
| henter på nytt hver gang    | cacher på `queryKey`                     |
| ingen retry                 | prøver 3 ganger ved feil                 |

4. Etter `isPending`/`error`-sjekkene vet TypeScript at `user` finnes.
5. Dynamisk tittel med navnet.

**Prøv:** Åpne eier-siden, gå tilbake, gå inn igjen → data vises med en gang.
Sammenlign med detaljsiden, som viser «Henter …» hver gang.

**Spørsmål**

**Hva er `queryKey`?**
Navnet på dataene i cachen. Alt `queryFn` avhenger av (her `userId`) må være med – ellers
deler to brukere samme cache-plass og du ser feil person.

**Hvorfor lastes eier-siden umiddelbart andre gang?**
Svaret ligger i cachen under `["user", userId]`. Query viser det med en gang og sjekker i
bakgrunnen om det er nytt.

**Hvorfor lages `QueryClient` utenfor komponenten?** → se steg 1.

---

## Steg 7 – Skjermer utenfor tabs og delt state

**Mål:** Skjermer som legges oppå tab-baren, og state som deles mellom skjermer.

**Filer:** `src/app/new-task.tsx`, `src/app/settings.tsx`, `src/app/about.tsx`,
`src/app/_layout.tsx`, `src/contexts/TasksContext.tsx`, `src/api/dummy-json.ts`,
`src/components/tasks/TaskRegister.tsx`

**Vis**

1. Det er *plasseringen* som avgjør om tab-baren vises, ikke fila. `new-task.tsx`,
   `settings.tsx` og `about.tsx` ligger rett i `app/` – altså i rot-Stacken, utenfor
   `(tabs)/`:

```tsx
<Stack.Screen name="new-task" options={{ title: "Ny oppgave" }} />
<Stack.Screen name="settings" options={{ title: "Innstillinger" }} />
<Stack.Screen name="about" options={{ title: "Om appen" }} />
```

2. De legges oppå hele tab-navigatoren og får rot-Stackens header med tilbake-knapp.
3. Samme `TaskRegister` som i demoen – nytt er bare `error`-prop og hva vi gjør etterpå.
4. `handleRegisterTask`: zod (`NewTaskSchema.safeParse`) → `add()` → `router.back()`.
5. «Avbryt»-knapp – gjør det samme som tilbake, men er tydelig i et skjema.
6. `TasksContext.tsx`: `TasksProvider` + `useTasks()`, state løftet over navigatoren.
   `toggle`/`add`/`remove` lager alltid ny array.
7. Henting i contexten: `useState([])` i stedet for `useState(TASKS)`, og `useEffect` med
   tomt array som henter `dummyjson.com/todos?limit=8`. Gå gjennom steg 1–5 i kommentarene:
   `fetch` → `response.ok` → `response.json()` (`unknown`) → `TodosResponseSchema.parse`
   → `todos.map(toTask)` → `setTasks`. Pluss `isLoading`/`error`, `AbortController` og
   opprydding.
8. `toTask`: API-et sier `todo`/`completed`/tall-id, appen sier `title`/`done`/streng-id.
   Oversett én gang – `TaskItem`, `TaskList` osv. trenger ikke endres.
9. Skjermene må tåle at lista ikke er hentet ennå: `tasks/index.tsx` og `[id].tsx` viser
   `Loading` mens `isLoading` er `true`.

**Prøv**

- `+` på lista → «Ny oppgave» glir inn, tab-baren er borte, tilbake-knapp i headeren.
- Skriv 1–2 tegn → valideringsfeil.
- Legg til en oppgave → du er tilbake på lista, og lista og badgen er oppdatert.
- Åpne den nye oppgaven → API gir 404 → feil-tilstand i «Fra API».
- Profil → Innstillinger → tilbake. Samme prinsipp: utenfor tabs = ingen tab-bar.
- Flytt `new-task.tsx` til `(tabs)/tasks/new-task.tsx` (oppdater `href` til
  `/tasks/new-task` og fjern `<Stack.Screen name="new-task">` fra `_layout.tsx`) →
  tab-baren blir stående.
- Åpne `https://dummyjson.com/todos?limit=8` i nettleseren – det er dette contexten får.
- Refresh / lukk appen og åpne igjen → lista hentes på nytt, den nye oppgaven er borte.
- Skru på flymodus og refresh → «Klarte ikke å hente oppgaver».

**Spørsmål**

**Hvorfor blir tab-baren stående på detaljsiden, men ikke på «Ny oppgave»?**
Detaljsiden ligger *inne i* tabs (i Oppgaver-stacken). «Ny oppgave» ligger i rot-Stacken,
*utenfor* tabs, og legges derfor oppå hele tab-navigatoren.

**Hvor bør en skjerm ligge – i en tab-stack eller i rot-Stacken?**
Spør: skal tab-baren være synlig? Detaljer som hører til én tab (oppgave, eier) legges i
tabens Stack. Skjermer som er en «egen oppgave» (skjema, innstillinger, admin) legges i
rot-Stacken, så de kan åpnes fra alle tabs og har fokus.

**Hvordan sender jeg data *tilbake* fra «Ny oppgave»?**
Ikke via navigasjonen. Oppdater delt state (her `add()` i context) og gå tilbake –
skjermen under leser samme state og oppdateres selv.

**Vi hadde jo `TasksContext` i demoen også – hva er nytt?**
Ingenting i selve contexten (bare `remove`). I demoen lå alt på én skjerm, så props
hadde holdt. Nå rendres skjermene av ruteren – vi skriver aldri
`<TaskDetail task={...} />`, og kan derfor ikke gi dem props. Delt state *må* ligge
over navigatoren.

**Blir ikke Context tregt?**
Alle som bruker `useTasks()` rendres på nytt når lista endres. For en liten app er det
helt greit. Med mye state kan man dele opp contexter eller bruke Zustand/Jotai.

**Forsvinner oppgavene når jeg lukker appen?**
Endringene, ja. Lista hentes fra API-et ved hver oppstart, men `toggle`/`add`/`remove`
endrer bare state i minnet – API-et vet ingenting. Skal endringer overleve, må de sendes
til API-et (POST/PATCH/DELETE) eller lagres lokalt (AsyncStorage/SQLite).

**Hvorfor hente i contexten og ikke i `tasks/index.tsx`?**
Flere skjermer trenger lista (Hjem, Oppgaver, detaljsiden, badgen). Henter vi i én skjerm,
har de andre ingenting før den skjermen er åpnet. I contexten hentes den én gang for alle.

**Hvorfor kan ikke `useEffect` være `async`?**
En effekt kan returnere en oppryddingsfunksjon – en `async`-funksjon returnerer alltid et
Promise. Derfor lager vi `async function loadTasks()` inni og kaller den.

**Hvorfor feiler API-kallet for en oppgave jeg la til selv?**
Nye oppgaver får `id` fra `Date.now()`, som ikke finnes i dummyjson → 404. Det er med
vilje, så man ser feil-tilstanden.

**Hvorfor ser det forskjellig ut på iOS og Android?**
Stack bruker native navigasjon, og hver plattform har sine egne animasjoner. Ikonene er
SF Symbols på iOS og Material Symbols på Android/web.

---

## Steg 8 – Navigere på tvers

**Mål:** Hoppe mellom tabs, ut av tabs og dypt inn i en stack – og få «tilbake» til å virke.

**Filer:** `(tabs)/index.tsx`, `(tabs)/tasks/_layout.tsx`

**Vis**

1. `<Link href="/tasks">` – bytter tab, samme som å trykke på den.
2. `<Link href={{ pathname: "/tasks/[id]", params: { id: "3" } }}>` – rett inn i en
   annen tabs stack.
3. `<Link href="/about">` – skjerm utenfor tabs, fra en tab.
4. `<Link href="/users">` og rett til `/users/68` – mer om disse i steg 9.
5. `router.push("/new-task")` – navigasjon fra kode.
6. `unstable_settings.initialRouteName = "index"` legger lista under detaljsiden.

**Prøv**

- «Åpne oppgave 3 direkte» → trykk tilbake → du havner på lista, ikke Hjem.
- Kommenter ut `unstable_settings` og gjør det samme → ingen tilbake-knapp.
- Bytt `router.push` med `router.replace` og se hva som skjer med «tilbake».

**Spørsmål**

**Forskjellen på `push`, `replace`, `back` og `navigate`?**
- `push` – legg ny skjerm oppå, kan gå tilbake.
- `replace` – bytt ut nåværende, kan *ikke* gå tilbake (typisk etter innlogging).
- `back` – ett steg tilbake.
- `navigate` – gå til ruten; finnes den allerede i stacken, gå dit i stedet for å
  legge en ny oppå.

**Hva gjør `initialRouteName` / `unstable_settings`?**
Hopper du rett til `/tasks/3` fra Hjem eller en dyplenke, inneholder stacken bare
detaljsiden. `initialRouteName: "index"` legger lista under, så «tilbake» virker.

**`<Link>` eller `router.push()`?** → se steg 4.

---

## Steg 9 – Mappe med dynamisk rute utenfor tabs (`/users/[userId]`)

**Mål:** Se at en dynamisk rute ikke trenger tabs – den kan ligge i en egen mappe rett i
`app/`, og åpnes direkte.

**Filer:** `src/app/users/_layout.tsx`, `users/index.tsx`, `users/[userId].tsx`,
`src/app/_layout.tsx`, `src/components/users/UserInfo.tsx`, `UserItem.tsx`

**Vis**

1. Sammenlign mappene – samme mønster, ulik plassering:

```
app/(tabs)/tasks/_layout.tsx   app/users/_layout.tsx      <- egen Stack
app/(tabs)/tasks/index.tsx     app/users/index.tsx        <- liste
app/(tabs)/tasks/[id].tsx      app/users/[userId].tsx     <- dynamisk
        ↑ inne i en tab                ↑ i rot-Stacken
          (tab-baren står)               (ingen tab-bar)
```

2. `_layout.tsx` (rot): `<Stack.Screen name="users" options={{ headerShown: false }} />` –
   `users/` har egen header, akkurat som Oppgaver-taben.
3. `users/_layout.tsx`: `initialRouteName: "index"` – lista under når `/users/68` åpnes
   direkte.
4. Rot-`_layout.tsx`: `initialRouteName: "(tabs)"` – samme triks ett nivå opp, så en
   dyplenke har Hjem under seg.
5. `users/index.tsx`: `useQuery` + `FlatList`, hver rad en `UserItem` (samme oppbygning som
   `TaskItem`). Lista hentes her, ikke i en context – bare denne skjermen trenger den.
6. `users/[userId].tsx`:
   - `useLocalSearchParams<{ userId: string }>()` – som `[id].tsx`.
   - `queryKey: ["user", userId]` – **samme nøkkel** som `tasks/user/[userId].tsx`.
   - `Number(userId) + 1` – parametere er strenger, så vi gjør om selv.
   - `<Link push href={{ pathname: "/users/[userId]", params: { userId: nextUserId } }}>` –
     samme fil, ny parameter, ny skjerm oppå.
7. `UserInfo` brukes av begge brukersidene og av `UserItem` – samme visning tre steder.

**Prøv**

- Web: skriv `http://localhost:8081/users/68` i adressefeltet. Ingen tab-bar, ingen tab
  involvert.
- Trykk tilbake → lista (selv om du aldri åpnet den). Tilbake igjen → Hjem.
- «Neste bruker» noen ganger, så tilbake → du går baklengs gjennom brukerne.
- Hjem → «Åpne oppgave 3 direkte» → «Se hvem som eier den» (bruker 68). Så Hjem → «Åpne
  bruker 68 direkte» → vises med en gang, uten «Henter …» (delt cache).
- `/users/999` → API-et svarer 404 → feil-tilstand. `/users/abc` → 400, samme tilstand.
- Kommenter ut `unstable_settings` i `users/_layout.tsx` og åpne `/users/68` → tilbake går
  rett til Hjem.

**Spørsmål**

**Hvorfor har `users/` sin egen `_layout.tsx`?**
For å få samme oppførsel som `tasks/`: `initialRouteName` legger lista under når
`/users/68` åpnes direkte. Uten egen layout ville `users/index` og `users/[userId]` blitt
to løse skjermer i rot-Stacken – det virker også, men da finnes det ingen liste å gå
tilbake til fra en dyplenke.

**Hvorfor får lista en tilbake-knapp når den er nederst i sin Stack?**
`users`-Stacken er nøstet i rot-Stacken. Den første skjermen arver «tilbake» fra
forelderen – så den går tilbake dit du kom fra (f.eks. Hjem).

**Hvorfor står det `/users?userId=68` etter at jeg gikk tilbake til lista?**
Skjermen som `initialRouteName` legger under, får samme parametere som skjermen du åpnet.
Ufarlig her – lista bryr seg ikke om `userId`.

**Hvorfor `push` på «Neste bruker»?**
Lenken går til samme fil med en annen parameter. `push` sier eksplisitt «legg en ny skjerm
oppå» – da går «tilbake» til forrige bruker. Med `replace` ville den byttet ut den
nåværende.

**Hvorfor vises `/users/68` med en gang etter at jeg har sett eieren av oppgave 3?**
Begge skjermene bruker `queryKey: ["user", userId]`. Cachen bryr seg ikke om hvor i
rutetreet skjermen ligger – samme nøkkel, samme data.

**Når legger jeg en dynamisk rute i en tab, og når utenfor?**
Hører den til én tab (en oppgave under Oppgaver), legg den i tabens Stack. Er den et eget
område som skal kunne åpnes fra hvor som helst (en brukerprofil, en artikkel), legg den
i rot-Stacken.

---

## Steg 10 – Dyplenker og `+not-found`

**Mål:** Se at URL-en er nok til å åpne hvilken som helst skjerm – utenfra.

**Filer:** `app.json` (`scheme`), `src/app/+not-found.tsx`

**Vis**

1. `scheme: "navigation-stack-tabs"` i `app.json` gir `navigation-stack-tabs://…`-lenker.
2. `+not-found.tsx` fanger alt som ikke matcher, med lenke til `/`.
3. Detaljsiden har egen «Fant ikke oppgaven»-tilstand for `/tasks/999` – ruten finnes,
   men ikke dataene.

**Prøv:** Åpne `/tasks/3`, `/tasks/999`, `/users/68`, `/settings` og `/finnes-ikke` utenfra
(se tabellen under). Merk at «tilbake» fra `/tasks/3` og `/users/68` virker takket være
`initialRouteName` (steg 8 og 9).

**Spørsmål**

**Hvordan åpner jeg en dyplenke?**
Med `pnpm start` kjørende:

| Hvor                           | Kommando                                                            |
| ------------------------------ | ------------------------------------------------------------------- |
| Web                            | Skriv `http://localhost:8081/tasks/3` i adressefeltet               |
| iOS simulator (Expo Go)        | `npx uri-scheme open "exp://127.0.0.1:8081/--/tasks/3" --ios`       |
| Android emulator (Expo Go)     | `npx uri-scheme open "exp://10.0.2.2:8081/--/tasks/3" --android`    |
| Development build / ferdig app | `npx uri-scheme open "navigation-stack-tabs://tasks/3" --ios`       |

`/--/` skiller Metro-adressen fra app-ruten i Expo Go. Eget skjema
(`navigation-stack-tabs://`, fra `scheme` i `app.json`) er ikke registrert i Expo Go – det
virker først i en development build (`npx expo run:ios`). Bytt `tasks/3` med `finnes-ikke`
for å se `+not-found`. Fysisk telefon: bruk IP-en Metro viser i terminalen.

**Hva skjer hvis appen ikke har en `/`-rute?** → se steg 1.

---

## Steg 11 – Innlogget bruker i context (`AuthProvider`)

**Mål:** Forstå hvor lenge data i context «lever» – og hvorfor brukeren må hentes på
nytt ved hver oppstart.

**Filer:** `src/contexts/AuthContext.tsx`, `src/api/auth.ts`, `src/app/_layout.tsx`,
`(tabs)/profile.tsx`, `(tabs)/index.tsx`

**Vis**

1. `api/auth.ts`: `fetchCurrentUser()` later som den er `GET /me` – venter 800 ms og
   returnerer en fast bruker (validert med zod). Logger `[auth] Henter innlogget bruker`.
2. `AuthContext.tsx`: samme mønster som `TasksContext` – men `useState(null)` +
   `useEffect(..., [])` som henter brukeren. Gå gjennom livsløpet i kommentaren øverst:
   oppstart → `null` → hent → `setUser` → navigering (ingen ny henting) → refresh → start
   på nytt.
3. `_layout.tsx`: `AuthProvider` ligger over navigatoren (og over `TasksProvider`), så
   den mountes én gang og aldri på nytt ved navigering.
4. `_layout.tsx` → `RootNavigator`: mens `isLoading` er `true` vises bare «Henter bruker …».
   Appen vises først når vi vet hvem brukeren er (viktig for rollen i neste steg).
5. `profile.tsx` og `index.tsx`: begge leser `useAuth()`, ingen henter selv.

**Prøv**

- Start appen med konsollen åpen: `[auth] Henter …` kommer **én** gang.
- Bytt tab, åpne en oppgave, åpne «Ny oppgave»: ingen ny logglinje.
- Refresh (F5 på web, «r» i Metro): brukeren er borte et øyeblikk, ny logglinje.
- «Hent bruker på nytt» på Profil: samme flyt, uten å refreshe hele appen.

**Spørsmål**

**Hvorfor ikke lagre brukeren i AsyncStorage så vi slipper å hente?**
Det man lagrer er en *token* (f.eks. `expo-secure-store`), ikke brukeren. Brukerdata kan
ha endret seg på serveren (navn, rolle, sperret konto). API-et er sannheten – context er
bare en kopi mens appen kjører.

**Hvorfor `null` og ikke en tom bruker `{}`?**
`null` sier tydelig «vet ikke ennå». Da tvinger TypeScript skjermene til å håndtere
laster-tilstanden (`if (!user)`), i stedet for å vise tomme felter.

**Hva med utlogging og innloggingsskjerm?**
Utlogging = slett token + `setUser(null)`. En innloggingsskjerm løses med samme verktøy som
i neste steg: `<Stack.Protected guard={!user}>` rundt `login` og `guard={!!user}` rundt
resten. Ikke med her – fokus er at brukeren hentes og deles via context.

---

## Steg 12 – Rolle og beskyttet rute (`/admin`)

**Mål:** En skjerm som bare finnes for brukere med riktig rolle.

**Filer:** `src/api/auth.ts`, `src/contexts/AuthContext.tsx`, `src/app/_layout.tsx`,
`src/app/admin.tsx`, `(tabs)/index.tsx`, `(tabs)/profile.tsx`

**Vis**

1. `api/auth.ts`: `role: z.enum(["admin", "user"])` på brukeren. To kontoer, og
   `simulateLogin(role)` som later som vi logger inn med en annen.
2. `AuthContext.tsx`: `isAdmin = user?.role === "admin"` – avledet, ikke egen state.
   `loginAs(role)` henter `/me` på nytt.
3. `_layout.tsx`:

```tsx
<Stack.Protected guard={isAdmin}>
  <Stack.Screen name="admin" options={{ title: "Admin" }} />
</Stack.Protected>
```

   `guard={false}` = ruten finnes ikke. Link, `router.push` og dyplenker til `/admin` sendes
   til `/`. Står man *på* `/admin` når guard blir `false`, sendes man ut, og `/admin` fjernes
   fra historikken.
4. `admin.tsx` i rot-Stacken (som `new-task.tsx`): kan åpnes fra hvor som helst, ligger
   over tab-baren. Skjermen sjekker ikke rollen selv – rendres den, er brukeren admin.
5. `index.tsx`: lenken vises bare for admin. Men det er **ikke** beskyttelsen.

**Prøv**

- Som Ola: ingen admin-lenke på Hjem. Skriv `/admin` i adressefeltet → du havner på `/`.
- Profil → «Logg inn som admin» → Hjem → «Åpne admin-panelet» → `/admin`.
- «Bytt til vanlig bruker» på admin-siden → kastes ut til `/`.
- Refresh mens du er admin → tilbake til Ola (den simulerte «tokenen» lå bare i minnet).

**Spørsmål**

**Er appen nå sikker?**
Nei. `Stack.Protected` skjuler bare skjermen i appen. Koden og dataene kan fortsatt nås.
API-et må selv sjekke rollen på hver forespørsel (403 hvis ikke admin).

**Hvorfor holder det ikke å skjule lenken?**
URL-er kan skrives inn eller komme som dyplenker. Uten `Stack.Protected` åpnes skjermen
uansett hvordan man kom dit.

**Hvorfor viser `_layout.tsx` «Henter bruker …» før appen?**
Før `/me` har svart er `isAdmin` `false`. Viste vi navigatoren da, ville en admin som
refresher på `/admin` bli kastet ut før svaret kom.

**Hvorfor ligger `/admin` i rot-Stacken og ikke i tabs?**
Da er den tilgjengelig fra hele appen og legger seg over tab-baren. Skal den være en egen
tab, brukes `Tabs.Protected` på samme måte.

**Kan jeg velge hvor man sendes?**
I SDK 58 kommer `redirectTo` på `Protected`. I SDK 57 (dette prosjektet) sendes man til
ankerskjermen, her `/`.

---

## Oppsummering

### Forskjeller fra `mobile/demo`

| Demo                                        | Navigasjon (Stack + Tabs)                             |
| ------------------------------------------- | ----------------------------------------------------- |
| Én skjerm (`index.tsx`)                     | Mange skjermer i et rutetre                           |
| `TasksContext` valgfritt (alt på én skjerm) | `TasksContext` nødvendig (skjermer får ikke props)     |
| `TaskList` med `TaskRegister` inni, `.map`  | `TaskList` med `FlatList`, `TaskRegister` på egen skjerm |
| `TaskLayout` tegner header                  | Navigatoren tegner header og tab-bar                  |
| `useState(TASKS)` – lokal konstant          | `useState([])` + `useEffect` – lista hentes fra API    |
| Ingen bruker                                | Innlogget bruker med rolle i `AuthContext`             |
| Ingen tilgangsstyring                       | `/admin` beskyttet med `Stack.Protected`               |

### Forskjeller fra `mobile/navigation`

| `mobile/navigation`                              | `mobile/navigation-stack-tabs`                         |
| ------------------------------------------------ | ------------------------------------------------------ |
| Stack → Drawer → Tabs → Stack                    | Stack → Tabs → Stack                                   |
| Innstillinger/Om appen i skuffen                 | Innstillinger/Om appen i rot-Stacken, nås med lenker   |
| «Ny oppgave» som modal (`presentation: "modal"`) | «Ny oppgave» som vanlig Stack-skjerm                   |
| ☰ i headeren, `GestureHandlerRootView`           | Ikke nødvendig                                         |
| –                                                | Mappe `users/` med dynamisk `[userId]` utenfor tabs    |
| Ingen `unstable_settings` i rot-layouten         | `initialRouteName: "(tabs)"` – dyplenker får tilbake   |
