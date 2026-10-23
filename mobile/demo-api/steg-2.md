# Steg 2: tabs, stack i en tab og detaljside

**Mål:** strukturen fra navigation-stack-tabs. Appen får en tab-bar (Hjem og Oppgaver), en egen stack i Oppgaver-taben med detaljsiden `/tasks/[id]`, og «Ny oppgave» som egen skjerm over tab-baren.

Let etter `STEG 2:` i koden.

## Flyttet

`src/app/index.tsx` er **slettet**. Innholdet (se `steg-0.md` og `steg-1.md`) er delt i tre:

| Fra `app/index.tsx` | Til |
|---|---|
| Lenkene og «Antall tasks» | `(tabs)/index.tsx` |
| Lista, `handleToggle`/`handleRemove`, laster og feil | `(tabs)/tasks/index.tsx` |
| `handleRegister` og skjemaet (`TaskRegister` fra `TaskList`) | `new-task.tsx` |

## Rutetreet

```
src/app/
  _layout.tsx            rot-Stack: (tabs), new-task, about, settings, students, admin
  new-task.tsx           "/new-task"   oppå tab-baren
  (tabs)/_layout.tsx     tab-baren
    index.tsx            "/"           Hjem
    tasks/_layout.tsx    Stack i taben
      index.tsx          "/tasks"      lista
      [id].tsx           "/tasks/abc"  detaljsiden
```

---

## Filene, i rekkefølge

### 1. `src/app/_layout.tsx`
- `unstable_settings = { anchor: "(tabs)" }`, så en dyplenke til en skjerm utenfor tabs har Hjem under seg.
- `<Stack.Screen name="(tabs)" options={{ headerShown: false }} />`. Tabs tegner sine egne headere.
- `<Stack.Screen name="new-task" ... />`. Alt i rot-Stacken legges **oppå** tab-baren.

### 2. `src/app/(tabs)/_layout.tsx` (ny) og `src/components/shared/Icon.tsx` (ny)
- `Tabs` fra `expo-router/js-tabs`, med skjermene `index` (Hjem) og `tasks` (Oppgaver).
- Oppgaver-taben har `headerShown: false`, fordi stacken har sin egen header. Uten det blir det to headere.
- `tabBarBadge` viser antall åpne oppgaver, hentet fra `useTasks()`.
- `Icon` er en liten wrapper rundt `SymbolView` fra `expo-symbols`, som demo allerede har.

### 3. `src/app/(tabs)/index.tsx` (ny)
- Hjem. Lenkene fra `app/index.tsx`, pluss «Gå til oppgaver» (`/tasks`) og «Ny oppgave» (`/new-task`).
- `(tabs)` er en gruppe, så parentesen er ikke med i URL-en. Denne fila er derfor `/`.

### 4. `src/app/(tabs)/tasks/_layout.tsx` (ny)
- En `Stack` inne i taben, med titler for `index` og `[id]`.
- `unstable_settings = { anchor: "index" }`, så en direkte lenke til `/tasks/abc` har lista under seg.

### 5. `src/app/(tabs)/tasks/index.tsx` (ny)
- Lista fra `app/index.tsx` (steg 0 og 1), uten `TaskRegister` og `TaskLayout`. Navigatoren tegner headeren nå.
- «+» i headeren lages med `<Stack.Screen options={{ headerRight }} />` og `<Link href="/new-task" asChild>`.
- `ScrollView`, fordi lista kan bli lengre enn skjermen.

### 6. `src/components/tasks/TaskList.tsx`
- `onRegister` og `TaskRegister` er fjernet. Lista viser bare lista.

### 7. `src/components/tasks/TaskItem.tsx`
- Raden er en vanlig `View` (før var den en `Pressable` som togglet).
- Det er tre trykkbare ting **ved siden av** hverandre:
  - boksen er en `Pressable` som toggler
  - tittelen er en `Link` til `/tasks/[id]`
  - «Slett» er en `Pressable` som sletter

### 8. `src/app/(tabs)/tasks/[id].tsx` (ny) og `src/api/tasks.ts`
- `useLocalSearchParams()` gir `id`, som alltid er en streng.
- Tittel og status slås opp i context. «Opprettet» og «Frist» hentes med `getTask(id)` i en `useEffect` med `[id]`.
- `api/tasks.ts` har fått `getTask()` og `ApiTaskDetailSchema = ApiTaskSchema.extend({ dueDate, createdAt })`.
- Tittelen settes dynamisk med `<Stack.Screen options={{ title }} />`.
- Slett kaller `router.back()` **først**, og så `removeApi()`. Siden slettingen er optimistisk, forsvinner oppgaven fra context med en gang, og da finnes ikke lenger det skjermen viser. Feil vises derfor i en `Alert`.
- Ukjent id gir «Fant ingen oppgave», mens en dyplenke under oppstart viser «Henter ...».

### 9. `src/app/new-task.tsx` (ny)
- `TaskRegister` og `handleRegister` fra `app/index.tsx`, pluss `router.back()` når oppgaven er lagret.
- Ved feil blir skjemaet stående og viser feilen. «Avbryt» kaller `router.back()`.

`TasksContext.tsx` har bare fått oppdaterte kommentarer i dette steget.

---

## Avvik fra navigation-stack-tabs, og hvorfor

- **Bare tittelen er lenke**, ikke hele raden med `<Link asChild>`. Det er to grunner:
  1. `Link asChild` godtar verken style-funksjon (`({ pressed }) => ...`) eller style-array. expo-router kaster en feil.
  2. Når én trykkbar ting ligger inni en annen, bobler klikket videre på web, så boksen både toggler og navigerer.
- Detaljsiden henter med `useEffect`, ikke med `use()` og `cache.ts`. Det kommer i steg 3.

## Prinsipper å vise

- **Tabs og Stack:** skjermer ved siden av hverandre, mot skjermer oppå hverandre. En tab husker sin egen stack.
- **Plasseringen avgjør:** `new-task` i rot-Stacken legges over tabs, og `[id]` i tab-stacken legger seg under tab-baren.
- **Navigere med `Link`** (trykk) og **med `router`** (fra kode, etter lagring eller sletting).
- **Context er nødvendig:** skjermene er søsken som ruteren lager, så de kan ikke få props fra hverandre.

## Test

Se punkt 10–16 i `TEST-OPPSKRIFT.md`. Kort fortalt:
- Badgen viser antall åpne og endres ved toggle.
- Tittelen åpner detaljsiden, og tab-baren står.
- Slett på detaljsiden tar deg tilbake til lista.
- «+» åpner skjemaet uten tab-bar.
- Bytter du tab og kommer tilbake, er bunken der du forlot den.
