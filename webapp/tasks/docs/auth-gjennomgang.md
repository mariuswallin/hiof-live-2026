# Auth-gjennomgang: cookie, vakter og rolle

Kjøreplan for videoen, ca. 39 minutter. Innloggingen er juks (ingen passord, du
velger bruker fra en liste), men alt som skjer ETTER innloggingen er likt i en
ekte app.

Åpne forhåndsvisningen (Cmd+Shift+V i VS Code) og klikk lenkene. De åpner fila
på riktig linje.

Teori: [leksjon 12, Autentisering og sesjoner](https://fullstaekk.no/courses/webapp-2026/lessons/autentisering-og-sesjoner).

## Det store bildet

Vis denne først, og kom tilbake til den mellom hvert steg.

```
Nettleser                           Server
---------                           ------
POST /login   userId=2       ->     finner brukeren, lager cookien
                             <-     303 + Set-Cookie: session=2

GET /tasks    Cookie: …      ->     1. setUser        hvem er du?      slår opp bruker og ROLLE
                                    2. vakt på ruta   får du lov hit?  401 / 403 / 302
                                    3. service        hva får DU se og gjøre?
                             <-     4. UI             hva skal vi vise?
```

| Lag | Spørsmål | Fil | Sier nei med |
| --- | --- | --- | --- |
| 1. Mellomvare | Hvem er du? | [`middleware.ts`](../src/features/auth/middleware.ts#L47) | `ctx.user = null` |
| 2. Vakt på ruta | Får du bruke denne ruta? | [`worker.tsx`](../src/worker.tsx#L33), [`task-routes.ts`](../src/features/tasks/task-routes.ts#L11) | 401, 403 eller 302 |
| 3. Service | Hva får du se og gjøre? | [`task-service.ts`](../src/features/tasks/task-service.ts#L104) | `{ ok: false }` med kode 401 eller 403 |
| 4. UI | Hva skal vi vise? | [`AuthProvider.tsx`](../src/features/auth/components/AuthProvider.tsx#L65) | knappen tegnes ikke |

Bare lag 1 til 3 er sikkerhet. Lag 4 er for brukeren.

## Før opptak

```bash
npm run migrate:dev   # ny kolonne: users.role
npm run seed          # Kari (id 1, admin) med to oppgaver, Ola (id 2, user) med én
npm run dev
```

- DevTools: Network med «Preserve log» på, og Application > Cookies.
- Start uinnlogget: slett cookien `session` hvis den finnes.
- Lagring og sletting er trege med vilje, og feiler omtrent hver tredje gang
  (`src/lib/demo-chaos.ts`). Får du «Tilfeldig feil (demo)», prøv en gang til.

## 1. Problemet, og hvem som finnes (4 min)

**Spørsmål:** Hvordan vet serveren hvem som spør, og hva de har lov til?

**Vis:** Forsiden sier «Ikke innlogget». API-et vet heller ikke hvem du er:

```bash
curl -i localhost:5173/api/v1/tasks        # 401, "Du må være innlogget"
```

**Åpne:**

- [`user-schema.ts`: rollen er en kolonne på brukeren](../src/db/schema/user-schema.ts#L9)
- [migrasjonen som la den til](../drizzle/migrations/20261011140418_light_eternals/migration.sql)
- [`seed.ts`: Kari er admin, Ola er vanlig bruker](../src/db/seed.ts#L13)
- [`auth-types.ts`: `Role` hentes fra databasen](../src/features/auth/auth-types.ts#L9), og [`SessionUser`](../src/features/auth/auth-types.ts#L18)

**Poeng:** Hver forespørsel er ny. Serveren trenger noe nettleseren sender med
hver gang, og det er en cookie. Rollen bor i databasen, så det er serveren som
bestemmer hvem som er admin.

## 2. Logg inn: serveren setter cookien (7 min)

**Spørsmål:** Hvem lager cookien, og hva står i den?

**Åpne, i denne rekkefølgen:**

1. [`LoginPage.tsx`: brukerne hentes fra databasen](../src/features/auth/pages/LoginPage.tsx#L22), og [vises i en nedtrekksliste](../src/features/auth/pages/LoginPage.tsx#L43)
2. [`auth-routes.ts`: samme adresse, GET viser og POST tar imot](../src/features/auth/auth-routes.ts#L131)
3. [`auth-routes.ts`: forenklet, uten controller og service](../src/features/auth/auth-routes.ts#L11)
4. [`auth-routes.ts`: `loginSchema`](../src/features/auth/auth-routes.ts#L39) og [`login`](../src/features/auth/auth-routes.ts#L49)
5. [`auth-routes.ts`: her ville passordet blitt sjekket](../src/features/auth/auth-routes.ts#L83)
6. [`auth-routes.ts`: cookien får bare id-en](../src/features/auth/auth-routes.ts#L110)
7. [`session.ts`: `serializeCookie`, attributtene](../src/features/auth/session.ts#L50)

**Vis:** Velg «Ola Hansen (user)» og logg inn.

- Network > `login`: status 303, og i svaret `Set-Cookie` og `Location`.
- Application > Cookies: `session` har verdien `2`, og HttpOnly er huket av.
- Console: `document.cookie` gir en tom tekst.

**Poeng:** Serveren setter cookien, i svaret. `HttpOnly` gjør at JavaScript på
siden ikke får lese den. Attributtene er de samme som i tabellen i leksjon 12.

**Si:** Innloggingen står rett i rutefila. Normalt har auth samme lagdeling som
tasks: routes, controller, service og repository.

## 3. Hvem er du? Fra cookie til `ctx.user` (5 min)

**Spørsmål:** Hva gjør serveren med cookien når den kommer tilbake?

**Åpne:**

1. [`middleware.ts`: `setUser`](../src/features/auth/middleware.ts#L47), og [oppslaget i databasen](../src/features/auth/middleware.ts#L56)
2. [`session.ts`: `readSessionUserId`](../src/features/auth/session.ts#L87)
3. [`worker.tsx`: `AppContext`](../src/worker.tsx#L16) og [`setUser` FØR rutene](../src/worker.tsx#L23)
4. [`types/rw.d.ts`: derfor er `ctx.user` typet overalt](../types/rw.d.ts)
5. [`AppLayout.tsx`: menyen leser `ctx.user`](../src/app/AppLayout.tsx#L23)

**Vis:** Øverst står det «Ola Hansen (user)». Cookien sa bare `2`. Navnet og
rollen kom fra databasen.

**Poeng:** Dette er autentisering: å finne ut hvem du er. Det skjer én gang per
forespørsel, i mellomvaren. Cookien sier bare HVEM, databasen sier hva du ER.
Endrer vi rollen i databasen, gjelder det fra neste klikk.

**Nevn signering:** Application > Cookies. Endre verdien fra `2` til `1`, og
last på nytt. Det står «Kari Nordmann (admin)». Serveren stoler på id-en i
cookien. Vis kommentaren i
[`session.ts`](../src/features/auth/session.ts#L18): en ekte app signerer
verdien, eller bruker en tilfeldig sesjons-id i stedet. Sett verdien tilbake
til `2`.

## 4. Får du lov? Vakter på rutene (7 min)

**Spørsmål:** Hvordan stopper vi en forespørsel før den når siden eller
controlleren?

**Åpne:**

1. [`middleware.ts`: mellomvare og interrupter, forskjellen](../src/features/auth/middleware.ts#L6)
2. [`requireUser`](../src/features/auth/middleware.ts#L70), [`requireAdmin`](../src/features/auth/middleware.ts#L94) og [`requireUserPage`](../src/features/auth/middleware.ts#L138)
3. [`worker.tsx`: `/tasks` med vakt foran siden](../src/worker.tsx#L33)
4. [`task-routes.ts`: en vakt per metode](../src/features/tasks/task-routes.ts#L11), og [`requireAdmin` på sletting](../src/features/tasks/task-routes.ts#L29)

**Vis i nettleseren:** Logg ut, og klikk «Oppgaver». Network viser `tasks` med
302, og du havner på `/login`.

**Vis med curl:**

```bash
# Logg inn med curl. -c lagrer cookien i en fil, -b sender den med.
curl -s -o /dev/null -c /tmp/ola.txt  -d "userId=2" localhost:5173/login
curl -s -o /dev/null -c /tmp/kari.txt -d "userId=1" localhost:5173/login

# 401: vi vet ikke hvem du er
curl -i localhost:5173/api/v1/tasks

# 200: innlogget. Kopier en id fra svaret.
curl -s localhost:5173/api/v1/tasks -b /tmp/ola.txt

# 403: vi VET hvem du er, og du får likevel ikke lov
curl -i -X DELETE localhost:5173/api/v1/tasks/<id> -b /tmp/ola.txt

# 204: Kari er admin
curl -i -X DELETE localhost:5173/api/v1/tasks/<id> -b /tmp/kari.txt -H "x-demo-chaos: off"
```

**Poeng:** En vakt returnerer enten ingenting (slipp forbi) eller en `Response`
(stopp her). 401 betyr «hvem er du?». 403 betyr «jeg vet hvem du er, og svaret
er nei». Et API svarer med JSON, en side sender deg til `/login` med 302.

## 5. Servicen: hvem eier oppgaven, og hvem ser hva (7 min)

**Spørsmål:** Vakten slapp deg inn. Hvilke oppgaver er dine?

**Vis:**

1. Logg inn som Ola. Du ser bare «Skrive obligen», ikke Karis oppgaver. Lag en
   oppgave i skjemaet. Den får merket `ola`.
2. Logg inn som Kari, som er admin. Nå ser du alle, og merket viser hvem som
   eier hver oppgave.

**Åpne, lagre på brukeren:**

1. [`actions.ts`: skjemaet sender `ctx.user` til servicen](../src/features/tasks/actions.ts#L48)
2. [`task-service.ts`: `create` krever innlogging](../src/features/tasks/task-service.ts#L147), og [eieren er `user.id`](../src/features/tasks/task-service.ts#L188)

**Åpne, hvem ser hva:**

1. [`TasksPage.tsx`: siden sender `ctx.user` til servicen](../src/features/tasks/pages/TasksPage.tsx#L33)
2. [`task-service.ts`: `list`](../src/features/tasks/task-service.ts#L104), og [admin ser alle, andre bare sine egne](../src/features/tasks/task-service.ts#L135)
3. [`task-repository.ts`: filteret på eier](../src/features/tasks/task-repository.ts#L106), og [eieren hentes i samme spørring](../src/features/tasks/task-repository.ts#L109)
4. [`task-mapper.ts`: `owner` er første del av e-posten](../src/features/tasks/task-mapper.ts#L22)
5. [`TaskItem.tsx`: merket i lista](../src/features/tasks/components/TaskItem.tsx#L56)

**Åpne, hvem får slette:**

- [`task-service.ts`: `remove`](../src/features/tasks/task-service.ts#L219), med [samme regel som `requireAdmin`](../src/features/tasks/task-service.ts#L234)

**Poeng:** Hvem du er, kommer alltid fra `ctx.user`, aldri fra skjemaet eller
URL-en. Og reglene står i servicen, fordi det finnes to veier inn: API-rutene og
server actions. En server action sendes til adressen til siden du står på, så
vaktene på API-rutene ser den aldri. Servicen er det eneste stedet begge veiene
går gjennom.

## 6. Hva viser vi? AuthProvider og useAuth (5 min)

**Spørsmål:** Hvordan vet en knapp langt nede i treet hvem som er innlogget?

**Åpne:**

1. [`AppLayout.tsx`: sender `ctx.user` til `AuthProvider`](../src/app/AppLayout.tsx#L28)
2. [`worker.tsx`: sidene pakkes inn i `AppLayout`](../src/worker.tsx#L29)
3. [`AuthProvider.tsx`: provideren](../src/features/auth/components/AuthProvider.tsx#L40) og [`useAuth`](../src/features/auth/components/AuthProvider.tsx#L65)
4. [`TaskItem.tsx`: `useAuth()`](../src/features/tasks/components/TaskItem.tsx#L17) og [slett-knappen](../src/features/tasks/components/TaskItem.tsx#L64)
5. [`auth-types.ts`: `isAdmin`, brukt av både server og klient](../src/features/auth/auth-types.ts#L34)

**Vis:**

- Ola: ingen «Slett».
- Bytt `isAdmin &&` med `true &&` i `TaskItem.tsx`. Trykk «Slett» som Ola.
  Network viser 403, og oppgaven står. Bytt tilbake.
- Kari: «Slett» er der, og virker.

**Poeng:** To ting heter nesten det samme. `ctx` bor på serveren og er
sannheten. React context bor i nettleseren og er en kopi vi tegner etter. En
knapp som er skjult, er ikke beskyttet.

## 7. Logg ut og oppsummering (4 min)

**Åpne:**

- [`AppLayout.tsx`: «Logg ut» er et skjema, ikke en lenke](../src/app/AppLayout.tsx#L45)
- [`auth-routes.ts`: `logout`](../src/features/auth/auth-routes.ts#L121)
- [`session.ts`: `clearSessionCookie`](../src/features/auth/session.ts#L73)

**Vis:** Trykk «Logg ut». Network > `logout`: `Set-Cookie` med `Max-Age=0`.
Klikk «Oppgaver»: du er tilbake på `/login`.

**Poeng:** Serveren kan ikke slette en cookie. Den sender samme cookie på nytt
med levetid null, og nettleseren kaster den selv. Utlogging er en POST, fordi en
GET aldri skal endre noe.

Avslutt med tabellen fra «Det store bildet», og denne:

| Forenklet her | I en ekte app |
| --- | --- |
| Du velger bruker fra en liste, uten passord | Passordet sjekkes mot en hash i databasen |
| Innloggingssiden viser alle brukerne | Siden røper aldri hvem som finnes |
| Cookien bærer bruker-id-en, usignert | Cookien er signert, eller bærer en tilfeldig sesjons-id som serveren slår opp |
| Innlogging og spørringer står rett i auth-filene | Auth har routes, controller, service og repository, som tasks |
| Alle innloggede kan endre en oppgave de kjenner id-en til | Servicen sjekker at oppgaven er din |

Likt i begge: rollen i databasen, attributtene på cookien, `setUser` og
`ctx.user`, vaktene på rutene, reglene i servicen og `AuthProvider`.

## Ekstra, hvis noen spør

Går cookien ut mens `/tasks` står åpen, svarer vakten med redirect også på en
server action. [`client.tsx`](../src/client.tsx#L7) laster da siden på nytt, og
du havner på `/login`.

## Etter opptak

`npm run seed` setter oppgavene tilbake. Sjekk at `true &&` i `TaskItem.tsx` er
byttet tilbake til `isAdmin &&`.
