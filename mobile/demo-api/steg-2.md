# Steg 2: auth, tabs og detaljside

**Mål:** appen logger inn mot webappen og sender et token på alle kall. Så får den strukturen fra navigation-stack-tabs: en tab-bar (Hjem og Oppgaver), en egen stack i Oppgaver-taben med detaljsiden `/tasks/[id]`, og «Ny oppgave» som egen skjerm over tab-baren.

Steget har to deler:

| Del | Hva | Merket i koden | I live `mobile/demo`? |
|---|---|---|---|
| **2A: auth** | Login-skjerm, token i `AuthContext`, `Authorization` på alle kall, `Stack.Protected` | `STEG 2A:` | ✅ Ja, `f62ea7f` + `319f332` |
| **2B: tabs** | Tab-bar, stack i en tab, detaljside, «Ny oppgave» som egen skjerm | `STEG 2B:` | ❌ Nei. Påbegynt: `new-task.tsx` |

Små ting som ikke hører til noen av delene, er merket `STEG 2:`. Søk etter `STEG 2` for å finne alt.

## Se endringene

Utgangspunktet er committet: live `mobile/demo` slik den var på `cef52b0`, med steg 0 og 1 ferdig og før auth. Den lokale taggen heter `demo-api-steg-2-baseline`.

```sh
git status mobile/demo-api        # alle filer steget rører
git diff -- mobile/demo-api       # endringene i filer som fantes fra før
```

Nye filer vises ikke i `git diff`. Det gjelder `api/auth.ts`, `app/login.tsx`, `app/(tabs)/` og `components/shared/Icon.tsx`.

## Forutsetning

- Webappen (`hiof-live-2026/webapp/tasks`, main) kjører, og seeden er kjørt (`npm run seed`).
- To brukere fra seeden: **1 = Kari Nordmann (admin)** og **2 = Ola Hansen (user)**.
- Webappen sjekker nå hvem du er:

| Rute | Vakt | Uten token | Som Ola (user) |
|---|---|---|---|
| `POST /api/v1/login` | – | ✅ | ✅ |
| `GET/POST /api/v1/tasks` | `requireUser` | 401 | bare egne oppgaver |
| `GET/PATCH /api/v1/tasks/:id` | `requireUser` | 401 | 403 hvis den ikke er hans |
| `DELETE /api/v1/tasks/:id` | `requireAdmin` | 401 | **403** «Bare admin har lov til dette» |

## Rutetreet etter steget

```
src/app/
  _layout.tsx            AuthProvider > TasksProvider > rot-Stack
                           Protected(!user):  login
                           Protected(user):   (tabs), new-task, about, settings, students
                             Protected(isAdmin): admin
  login.tsx              "/login"      bare uten bruker
  new-task.tsx           "/new-task"   oppå tab-baren
  (tabs)/_layout.tsx     tab-baren
    index.tsx            "/"           Hjem: bruker, Logg ut, lenker
    tasks/_layout.tsx    Stack i taben
      index.tsx          "/tasks"      lista
      [id].tsx           "/tasks/abc"  detaljsiden
```

---

## Del A: auth (`STEG 2A:`)

```
login.tsx ──login(2)──► AuthContext ──POST /api/v1/login──► webappen
                           │  token "2", user { Ola Hansen, role: "user" }
             ┌─────────────┴──────────────┐
      _layout.tsx (user)            TasksContext (token)
      Stack.Protected bytter        useEffect [token] -> listTasks(token)
      login -> (tabs)               Authorization: Bearer 2
```

### 1. `src/api/auth.ts` (ny)
- `ApiUserSchema` med `role: z.enum(["admin", "user"])`. Rollen kommer fra serveren.
- `login(userId)` gjør `POST /login` og returnerer `{ token, user }`.
- `BASE_URL` er hentet fra `api/tasks.ts`, som nå eksporterer den.

### 2. `src/api/tasks.ts`
- Alle funksjonene tar `token` som **første** parameter og sender `authorization: Bearer ${token}`.
- `HOST` er `10.0.2.2` på Android og `localhost` ellers (`STEG 2:`).

### 3. `src/contexts/AuthContext.tsx`
- Fjernet: den hardkodede «Lara Croft», `useEffect` og `isLoading`.
- Nytt: `token` og `user` i `useState`, `login(userId)` og `logout()`.
- Typene `User` og `Role` kommer fra `api/auth.ts`.

### 4. `src/contexts/TasksContext.tsx`
- Leser `token` med `useAuth()`. Derfor må `TasksProvider` ligge **inni** `AuthProvider`.
- `useEffect(..., [])` er blitt `useEffect(..., [token])`. Lista hentes når noen logger inn, og på nytt når en annen logger inn. Uten token tømmes lista.
- `requireToken()` kaster før kallet, i stedet for å sende et kall vi vet gir 401.

### 5. `src/app/login.tsx` (ny)
- To knapper (Kari og Ola), og feilen vises i rødt.
- Den gjør **ingen** `router.push()` etter innloggingen. Se punkt 6.

### 6. `src/app/_layout.tsx`
- `isLoading`-grenen med `<Loading />` er borte.
- `Stack.Protected guard={!validUser}` gir `login`. `Stack.Protected guard={validUser}` gir resten.
- Admin-vakten ligger **inni** innloggingsvakten.

### 7. `src/app/(tabs)/index.tsx`
- Navn, rolle og «Logg ut», flyttet fra gamle `app/index.tsx`.

### 8. `src/components/tasks/TaskItem.tsx`
- «Slett» vises fortsatt for alle. Ola får 403, og raden kommer tilbake. Det er med vilje.

### Prinsipper å vise
- **Token er mobilens cookie.** Webappen leser begge med samme `setUser`: `readSessionUserId(request) ?? readBearerUserId(request)`.
- **Serveren bestemmer.** Rollen, filtreringen av lista og 403 kommer fra webappen. Å skjule en knapp i appen er bare pynt.
- **`Stack.Protected` i stedet for navigasjon.** Login og logout endrer bare `user`. Ruteren bytter skjerm selv.
- **Rekkefølgen på providerne.** Den som trenger noe, må ligge inni den som har det.
- **`USIKKERT:` i koden:**
  - tokenet ligger bare i minnet, så du må logge inn igjen etter en restart (alternativet er `expo-secure-store`)
  - `logout()` kan ikke gjøre tokenet ugyldig på serveren
  - tokenet er bare bruker-id-en

---

## Del B: tabs, stack i en tab og detaljside (`STEG 2B:`)

### Flyttet

`src/app/index.tsx` er **slettet**. Innholdet er delt i tre:

| Fra `app/index.tsx` | Til |
|---|---|
| Brukerraden og «Logg ut» (2A), lenkene og «Antall tasks» | `(tabs)/index.tsx` |
| Lista, `handleToggle`/`handleRemove`, laster og feil | `(tabs)/tasks/index.tsx` |
| `handleRegister` og skjemaet (`TaskRegister` fra `TaskList`) | `new-task.tsx` |

### 1. `src/app/_layout.tsx`
- `anchor` er `"(tabs)"` (før `"index"`), så en dyplenke til en skjerm utenfor tabs har Hjem under seg.
- `<Stack.Screen name="(tabs)" options={{ headerShown: false }} />` erstatter `index`. Tabs tegner sine egne headere.
- `new-task` står i rot-Stacken. Alt der legges **oppå** tab-baren.

### 2. `src/app/(tabs)/_layout.tsx` (ny) og `src/components/shared/Icon.tsx` (ny)
- `Tabs` fra `expo-router/js-tabs`, med `index` (Hjem) og `tasks` (Oppgaver).
- Oppgaver-taben har `headerShown: false`, fordi stacken har sin egen header.
- `tabBarBadge` viser antall åpne oppgaver fra `useTasks()`.
- `Icon` er en liten wrapper rundt `SymbolView` (`expo-symbols`).

### 3. `src/app/(tabs)/index.tsx` (ny)
- Hjem: brukerraden (2A), «Antall tasks» og lenkene, pluss «Gå til oppgaver» og «Ny oppgave».
- `(tabs)` er en gruppe, så fila er `/`.

### 4. `src/app/(tabs)/tasks/_layout.tsx` (ny)
- En `Stack` inne i taben, med titler for `index` og `[id]`.
- `anchor: "index"`, så en direkte lenke til `/tasks/abc` har lista under seg.

### 5. `src/app/(tabs)/tasks/index.tsx` (ny)
- Lista fra `app/index.tsx`, uten `TaskRegister` og `TaskLayout`.
- «+» i headeren lages med `<Stack.Screen options={{ headerRight }} />` og `<Link href="/new-task" asChild>`.
- Den viser enten «laster» eller lista, aldri begge. `ScrollView`, fordi lista kan bli lang.

### 6. `src/components/tasks/TaskList.tsx`
- `onRegister` og `TaskRegister` er fjernet.

### 7. `src/components/tasks/TaskItem.tsx`
- Før lå boksen og tittelen i samme `Pressable`. Nå er det tre trykkbare ting **ved siden av** hverandre:
  - boksen toggler
  - tittelen er en `Link` til `/tasks/[id]`
  - «Slett» sletter
- Tittelen bruker `Theme.textDark`, som i live (`STEG 2:`).

### 8. `src/app/(tabs)/tasks/[id].tsx` (ny) og `src/api/tasks.ts`
- `useLocalSearchParams()` gir `id`, som alltid er en streng.
- Tittel og status slås opp i context. «Opprettet» og «Frist» hentes med `getTask(token, id)`. `useEffect` har `[id, token]`.
- `api/tasks.ts` har fått `getTask()` og `ApiTaskDetailSchema = ApiTaskSchema.extend({ dueDate, createdAt })`.
- Tittelen settes dynamisk med `<Stack.Screen options={{ title }} />`.
- Slett kaller `router.back()` **først**, og så `removeApi()`. Feil vises i en `Alert`, fordi skjermen allerede er borte.
- Ukjent id gir «Fant ingen oppgave». En dyplenke under oppstart viser «Henter ...».

### 9. `src/app/new-task.tsx`
- I live er den påbegynt, og feilen svelges der (`// Håndtere feil og sørge for at det vises frem`).
- Nå havner feilen i `saveError` og vises under skjemaet. Skjemaet blir stående ved feil.
- `router.back()` når oppgaven er lagret, og «Avbryt» går tilbake.

---

## Fra live `mobile/demo` i dag til ferdig steg 2

Live har allerede Del A. Det som gjenstår der, er Del B:

1. Opprett `(tabs)/_layout.tsx`, `(tabs)/tasks/_layout.tsx` og `Icon.tsx`.
2. Flytt `app/index.tsx` til `(tabs)/index.tsx` og `(tabs)/tasks/index.tsx`, og slett den gamle.
3. I `_layout.tsx`: bytt `index` med `(tabs)` (`headerShown: false`) inni `Stack.Protected guard={validUser}`, og sett `anchor: "(tabs)"`.
4. Fjern `TaskRegister` fra `TaskList`, og vis feilen i `new-task.tsx`.
5. Gjør tittelen i `TaskItem` til en `Link`, og legg til `[id].tsx` og `getTask(token, id)`.

Auth-filene (`api/auth.ts`, `AuthContext`, `TasksContext`, `login.tsx`) er like som i live, bortsett fra kommentarene. `api/tasks.ts` har i tillegg `getTask`.

## Avvik fra navigation-stack-tabs, og hvorfor

- **Bare tittelen er lenke**, ikke hele raden med `<Link asChild>`. Det er to grunner:
  - `Link asChild` godtar verken style-funksjon eller style-array.
  - Når én trykkbar ting ligger inni en annen, bobler klikket videre på web.
- Detaljsiden henter med `useEffect`, ikke med `use()` og `cache.ts`. Det kommer i steg 3.
- «Logg ut» ligger på Hjem. navigation-stack-tabs har en egen Profil-tab med kontobytte.

## Prinsipper å vise (tabs)

- **Tabs og Stack:** skjermer ved siden av hverandre, mot skjermer oppå hverandre. En tab husker sin egen stack.
- **Plasseringen avgjør:** `new-task` i rot-Stacken legges over tabs, og `[id]` i tab-stacken legger seg under tab-baren.
- **Navigere med `Link`** (trykk) og **med `router`** (fra kode, etter lagring eller sletting).
- **Context er nødvendig:** skjermene er søsken som ruteren lager, så de kan ikke få props fra hverandre. Det gjelder både `useTasks()` og `useAuth()`.
- **Auth og tabs sammen:** hele `(tabs)` ligger bak én vakt. Logger du ut, forsvinner tab-baren med alt i den.

## Test

Se punkt A1–A7 og 10–16 i `TEST-OPPSKRIFT.md`.
