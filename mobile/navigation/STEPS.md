# Steg for steg – navigasjon med Expo Router

Gjennomgang av `mobile/navigation`. Hvert steg har:

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
   tilbake → Profil → ☰ → Innstillinger → Om appen → `+` (modal).
2. Vis treet – dette er kartet resten av gjennomgangen følger:

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

3. Tommelfingerregel: **det som ligger ytterst, dekker det som ligger under.**

**Prøv:** Start på web (`w`) og se at URL-en i adressefeltet endrer seg når du navigerer.

---

## Steg 1 – Layout og filbasert routing

**Mål:** Forstå at filer = skjermer, og at `_layout.tsx` er navigatoren for mappen sin.

**Filer:** `src/app/_layout.tsx`

**Vis**

1. Kommentaren øverst i fila viser hele treet.
2. Konvensjonene:

| Konvensjon    | Betyr                                              | Eksempel                          |
| ------------- | -------------------------------------------------- | --------------------------------- |
| `fil.tsx`     | En skjerm                                          | `profile.tsx` → `/profile`        |
| `index.tsx`   | Standardskjermen i en mappe                        | `tasks/index.tsx` → `/tasks`      |
| `_layout.tsx` | **Navigatoren** for mappen (Stack, Tabs, Drawer)   | `(tabs)/_layout.tsx`              |
| `(gruppe)/`   | Organiserer filer, blir **ikke** del av URL-en     | `(drawer)/(tabs)/index.tsx` → `/` |
| `[param].tsx` | Dynamisk segment, leses med `useLocalSearchParams` | `tasks/[id].tsx` → `/tasks/3`     |
| `+not-found`  | Vises når ingen fil matcher URL-en                 |                                   |

3. Providers ligger **over** `<Stack>` – ellers når ikke skjermene dem:

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <QueryClientProvider client={queryClient}>
    <TasksProvider>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="new-task" options={{ presentation: "modal" }} />
        <Stack.Screen name="+not-found" options={{ title: "Oops" }} />
      </Stack>
    </TasksProvider>
  </QueryClientProvider>
</GestureHandlerRootView>
```

4. Hvorfor Stack helt ytterst: modalen skal dekke både skuff og tab-bar.
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
`/tasks`. Derfor er `(drawer)/(tabs)/index.tsx` bare `/`.

**Hvorfor kan jeg ikke legge komponenter i `app/`?**
Alt i `app/` blir en rute. En `task-item.tsx` der ville blitt en skjerm på `/task-item`.
Derfor ligger gjenbrukbare komponenter i `src/components/`.

**Må jeg liste opp alle skjermene i `_layout.tsx`?**
Nei. Filer som ikke er listet opp kommer med automatisk, men med standardtittel og i
alfabetisk rekkefølge. Vi lister dem opp for å styre rekkefølge, titler og ikoner.

**Hva skjer hvis appen ikke har en `/`-rute?**
Appen vet ikke hva den skal vise ved oppstart, og du havner på `+not-found`. Her er `/`
Hjem-taben.

**Hvorfor `GestureHandlerRootView`?**
Skuffen åpnes med sveip, og Gesture Handler trenger en rot-komponent for å fange
bevegelsene.

**Hvorfor lages `QueryClient` utenfor komponenten?**
Inne i komponenten ville den blitt laget på nytt ved hver render – med tom cache hver gang.

**Når bruker jeg Stack, Tabs eller Drawer?**
- **Tabs**: 3–5 hovedområder brukeren bytter mellom hele tiden.
- **Stack**: dybde – liste → detalj → mer detalj. Tilbake-knapp.
- **Drawer**: mange eller sjeldnere brukte valg (innstillinger, om, logg ut).
  Mindre vanlig på iOS enn Android.

---

## Steg 2 – Skuffen (Drawer)

**Mål:** Se at skjermer utenfor `(tabs)/` ikke har tab-bar, og hvordan man overstyrer et
menyvalg.

**Filer:** `src/app/(drawer)/_layout.tsx`, `(drawer)/settings.tsx`, `(drawer)/about.tsx`

**Vis**

1. `<Drawer.Screen name="...">` – `name` er filnavnet/mappenavnet.
2. `drawerLabel`, `title`, `drawerIcon` (via `Icon`-komponenten).
3. `(tabs)` er **én** skjerm for skuffen, med label «Oppgaver».
4. `headerShown: false` på `(tabs)` – tabs tegner sin egen header (mer i steg 3).
5. `listeners={goToTasksTab}`:

```tsx
drawerItemPress: (event) => {
  event.preventDefault();      // stopp standardoppførselen
  navigation.closeDrawer();
  router.navigate("/tasks");   // gå rett til Oppgaver-taben
},
```

**Prøv**

- Sveip fra venstre kant, eller trykk ☰.
- Åpne Innstillinger: **ingen tab-bar**, fordi skjermen ligger utenfor `(tabs)/`.
- Stå på Hjem, åpne skuffen, trykk «Oppgaver» → du havner på lista, ikke på Hjem.
- Kommenter ut `listeners` og gjør det samme – se forskjellen.

**Spørsmål**

**Hvorfor trengs `listeners` på «Oppgaver» i skuffen?**
`(tabs)` er én skjerm for skuffen. Trykker du på den, havner du i taben du sist var i –
og står du allerede i `(tabs)`, lukker skuffen seg bare. Med `drawerItemPress` +
`preventDefault()` overstyrer vi og navigerer rett til `/tasks`.

**Hvorfor `GestureHandlerRootView`?** → se steg 1.

---

## Steg 3 – Tabs

**Mål:** Forstå tabs som søsken som lever samtidig, og hvem som eier headeren.

**Filer:** `src/app/(drawer)/(tabs)/_layout.tsx`

**Vis**

1. Rekkefølgen på `<Tabs.Screen>` = rekkefølgen i tab-baren.
2. `tabBarIcon` og `tabBarBadge` – badgen er antall åpne oppgaver, lest fra `useTasks()`.
   `undefined` = ingen badge.
3. `headerLeft: () => <DrawerToggleButton />` – ☰ må inn her fordi skuffens header er
   skjult.
4. «Hvem eier headeren?»: skuffen skjuler sin, tabs viser sin. Oppgaver-taben skjuler
   *sin* (`headerShown: false`) fordi Stacken inni har egen header.

**Prøv**

- Fullfør en oppgave → badgen teller ned.
- Fjern `headerShown: false` på `(tabs)` i `(drawer)/_layout.tsx` → to headere.
- Gå inn på en detaljside, bytt til Profil, og tilbake til Oppgaver → du står fortsatt
  på detaljsiden.

**Spørsmål**

**Hvorfor fikk jeg to headere oppå hverandre?**
Hver navigator tegner sin egen header. Når de er nøstet, må du velge hvem som viser den:
`headerShown: false` på det ytre nivået. Se `(drawer)/_layout.tsx` og
`(tabs)/_layout.tsx`.

**Husker tabs hvor jeg var?**
Ja. Alle tabs lever samtidig. Bytter du tab midt i en detaljside og kommer tilbake, ligger
du fortsatt på detaljsiden.

**Hva med `NativeTabs`?**
Expo Router har også `NativeTabs` (ekte native tab-bar, «liquid glass» på iOS 26). Vi
bruker vanlige `Tabs` fordi de er like på alle plattformer, fungerer i skuffen og er
enklere å style – bra for læring.

---

## Steg 4 – Stack inne i en tab

**Mål:** Dybde inne i én tab, uten at tab-baren forsvinner.

**Filer:** `(tabs)/tasks/_layout.tsx`, `(tabs)/tasks/index.tsx`, `(tabs)/profile.tsx`

**Vis**

1. `tasks/_layout.tsx` er en `Stack`: liste → detalj → eier.
2. ☰ bare på `index` – de andre får tilbake-knapp automatisk.
3. `unstable_settings = { initialRouteName: "index" }` – kommer tilbake i steg 9.
4. `tasks/index.tsx`: **ingen props**, data fra `useTasks()`.
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

**Hvorfor forsvinner ☰-knappen på detaljsiden?**
Stacken viser tilbake-knapp når det finnes noe å gå tilbake til. ☰ er bare satt på
`index` i `tasks/_layout.tsx`. Skuffen kan fortsatt åpnes med sveip.

---

## Steg 5 – Lenke til detaljside

**Mål:** Navigere med `<Link>` og sende med en parameter.

**Filer:** `src/components/task-item.tsx`

**Vis**

1. Hele raden er en `Link`:

```tsx
<Link href={{ pathname: "/tasks/[id]", params: { id } }} asChild>
  <Pressable style={styles.container}>
    <Pressable onPress={() => onToggle?.(id)}>{/* avkrysningsboks */}</Pressable>
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

**Hvorfor to `Pressable` i `task-item.tsx`?**
Raden har to handlinger: trykk på raden → **naviger** til detalj, trykk på boksen →
**toggle** (bli på lista). Når to Pressable er nøstet, får den innerste trykket – så et
trykk på boksen navigerer ikke. Vil man ha det enklere: fjern den indre og la
toggling bare skje på detaljsiden.

---

## Steg 6 – Detaljside og henting med `useEffect`

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

- Åpne oppgave 1–8 – hver har en «tvilling» i dummyjson.
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

## Steg 7 – Videre i stacken og TanStack Query

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

## Steg 8 – Modal og delt state

**Mål:** En skjerm som legger seg over alt, og state som deles mellom skjermer.

**Filer:** `src/app/new-task.tsx`, `src/app/_layout.tsx`, `src/context/tasks-context.tsx`,
`src/components/task-register.tsx`

**Vis**

1. Det er `options` i rot-layouten, ikke fila, som gjør den til modal:
   `<Stack.Screen name="new-task" options={{ presentation: "modal" }} />`.
2. Samme `TaskRegister` som i demoen – nytt er bare `error`-prop og hva vi gjør etterpå.
3. `handleRegisterTask`: zod (`NewTaskSchema.safeParse`) → `add()` → `router.back()`.
4. «Avbryt»-knapp for Android.
5. `tasks-context.tsx`: `TasksProvider` + `useTasks()`, state løftet over navigatoren.
   `toggle`/`add`/`remove` lager alltid ny array.

**Prøv**

- `+` på lista → modal dekker både tab-bar og header.
- Skriv 1–2 tegn → valideringsfeil.
- Legg til en oppgave → lista og badgen oppdateres.
- Åpne den nye oppgaven → API gir 404 → feil-tilstand i «Fra API».
- Lukk appen helt og åpne igjen → den nye oppgaven er borte.

**Spørsmål**

**Hvorfor blir tab-baren stående på detaljsiden, men ikke i modalen?**
Detaljsiden ligger *inne i* tabs (i Oppgaver-stacken). Modalen ligger i rot-Stacken,
*utenfor* tabs, og legger seg derfor oppå alt.

**Hvordan sender jeg data *tilbake* fra modalen?**
Ikke via navigasjonen. Oppdater delt state (her `add()` i context) og lukk modalen –
skjermen under leser samme state og oppdateres selv.

**Hvorfor Context og ikke bare props som i demoen?**
Skjermene rendres av ruteren – vi skriver aldri `<TaskDetail task={...} />`, og kan
derfor ikke gi dem props. Delt state må ligge *over* navigatoren.

**Blir ikke Context tregt?**
Alle som bruker `useTasks()` rendres på nytt når lista endres. For en liten app er det
helt greit. Med mye state kan man dele opp contexter eller bruke Zustand/Jotai.

**Forsvinner oppgavene når jeg lukker appen?**
Ja, alt ligger i minnet. Neste steg er AsyncStorage/SQLite lokalt, eller et API.

**Hvorfor feiler API-kallet for en oppgave jeg la til selv?**
Nye oppgaver får `id` fra `Date.now()`, som ikke finnes i dummyjson → 404. Det er med
vilje, så man ser feil-tilstanden.

**Hvorfor en «Avbryt»-knapp i modalen?**
På iOS kan man dra modalen ned for å lukke den. Det finnes ikke på Android (der brukes
tilbake-knappen), så en synlig knapp er tryggest.

**Hvorfor ser det forskjellig ut på iOS og Android?**
Stack bruker native navigasjon, og hver plattform har sine egne animasjoner og
modal-stiler. Ikonene er SF Symbols på iOS og Material Symbols på Android/web.

---

## Steg 9 – Navigere på tvers

**Mål:** Hoppe mellom tabs, skuff og dypt inn i en stack – og få «tilbake» til å virke.

**Filer:** `(tabs)/index.tsx`, `(tabs)/tasks/_layout.tsx`

**Vis**

1. `<Link href="/tasks">` – bytter tab, samme som å trykke på den.
2. `<Link href={{ pathname: "/tasks/[id]", params: { id: "3" } }}>` – rett inn i en
   annen tabs stack.
3. `<Link href="/about">` – skuff-skjerm fra en tab.
4. `router.push("/new-task")` – navigasjon fra kode.
5. `unstable_settings.initialRouteName = "index"` legger lista under detaljsiden.

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

**`<Link>` eller `router.push()`?** → se steg 5.

---

## Steg 10 – Dyplenker og `+not-found`

**Mål:** Se at URL-en er nok til å åpne hvilken som helst skjerm – utenfra.

**Filer:** `app.json` (`scheme`), `src/app/+not-found.tsx`

**Vis**

1. `scheme: "navigation"` i `app.json` gir `navigation://…`-lenker.
2. `+not-found.tsx` fanger alt som ikke matcher, med lenke til `/`.
3. Detaljsiden har egen «Fant ikke oppgaven»-tilstand for `/tasks/999` – ruten finnes,
   men ikke dataene.

**Prøv:** Åpne `/tasks/3`, `/tasks/999` og `/finnes-ikke` utenfra (se tabellen under).
Merk at «tilbake» fra `/tasks/3` virker takket være steg 9.

**Spørsmål**

**Hvordan åpner jeg en dyplenke?**
Med `pnpm start` kjørende:

| Hvor                           | Kommando                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| Web                            | Skriv `http://localhost:8081/tasks/3` i adressefeltet            |
| iOS simulator (Expo Go)        | `npx uri-scheme open "exp://127.0.0.1:8081/--/tasks/3" --ios`    |
| Android emulator (Expo Go)     | `npx uri-scheme open "exp://10.0.2.2:8081/--/tasks/3" --android` |
| Development build / ferdig app | `npx uri-scheme open "navigation://tasks/3" --ios`               |

`/--/` skiller Metro-adressen fra app-ruten i Expo Go. Eget skjema (`navigation://`,
fra `scheme` i `app.json`) er ikke registrert i Expo Go – det virker først i en
development build (`npx expo run:ios`). Bytt `tasks/3` med `finnes-ikke` for å se
`+not-found`. Fysisk telefon: bruk IP-en Metro viser i terminalen.

**Hva skjer hvis appen ikke har en `/`-rute?** → se steg 1.

---

## Oppsummering – forskjeller fra `mobile/demo`

| Demo                                        | Navigasjon                                            |
| ------------------------------------------- | ----------------------------------------------------- |
| Én skjerm (`index.tsx`)                     | Mange skjermer i et rutetre                           |
| `tasks` i `useState` + props                | `tasks` i Context (`useTasks()`)                      |
| `TaskLayout` + `SafeAreaView` tegner header | Navigatoren tegner header og tab-bar                  |
| Data fra lokal konstant                     | Også data fra eksternt API (`useEffect` og `useQuery`) |
| Fem liste- og tre skjemavarianter           | Én av hver – fokus på navigasjon                      |
