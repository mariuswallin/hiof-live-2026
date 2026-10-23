# Veien videre: fra demo til navigation-stack-tabs

Utgangspunktet er `hiof-live-2026/mobile/demo`, slik den var før webapp-API-et.
Fasit og forklaringer finnes i `../navigation-stack-tabs`. Stegnumrene i «Se på» viser til `STEPS.md` der.
Webappen er `hiof-live-2026/webapp/tasks` (main), som kjører på `http://localhost:5173`.

## Ferdig i demo-api

| Steg | Hva | Filer og endringer |
|---|---|---|
| 0 | Liste og opprett mot webappen | `steg-0.md` |
| 1 | Toggle og slett mot webappen (vente eller optimistisk) | `steg-1.md` |
| 2 | Tabs, stack i en tab, detaljside og «Ny oppgave» som egen skjerm | `steg-2.md` |

Manuell test for alle stegene finnes i `TEST-OPPSKRIFT.md`.

## Hvor demo står

| Tema | demo-api | navigation-stack-tabs |
|---|---|---|
| Stack og skjermer utenfor (about, settings) | ✅ | ✅ steg 1 og 7 |
| Mappe med dynamisk rute | ✅ `students/[studentId]`, statisk liste | ✅ steg 9, hentet fra API |
| AuthProvider og `Stack.Protected` | ✅ hardkodet admin | ✅ steg 11–12: rolle fra «API», bytte konto |
| Liste og opprett mot webappen | ✅ steg 0 | ✅ |
| Toggle og slett mot webappen | ✅ steg 1 | ❌ (bare lokalt) |
| Tabs, badge og ikoner | ✅ steg 2 | steg 2 |
| Stack i en tab og detaljside `[id]` | ✅ steg 2 | steg 3–5 og 8 |
| `use()` + Suspense, eller TanStack Query | ❌ | steg 5–6 |
| Dyplenker og `+not-found` | ❌ | steg 10 |
| Tester (vitest og Playwright) | ❌ | ✅ |

## Senere

Naturlig neste steg er **3**: detaljsiden har nå det samme oppsettet som lista (`useEffect`, `isLoading` og `error`), og det er akkurat det steg 3 fjerner.

| Steg | Hva | Se på | Avhenger av |
|---|---|---|---|
| 3. Bedre henting | Erstatt `isLoading`/`error` i hver skjerm med `use()` + Suspense + `ErrorBoundary`, eller med TanStack Query. `useMutation` passer til steg 1. | Steg 5 (`api/cache.ts`, `SuspenseFallback`) og steg 6 (`useQuery`) | TanStack Query: `@tanstack/react-query`, den eneste avhengigheten demo mangler |
| 4. Auth | **Nå:** simulert innlogging med rolle validert med zod, bytte konto på Profil, og `Stack.Protected` som kaster brukeren ut. **Senere:** ekte auth mot webappen, med token i `expo-secure-store`, `Authorization`-header og håndtering av 401. | Steg 11–12: `api/auth.ts`, `AuthContext.tsx`, `AuthContextV2.tsx` og `hooks/useCurrentUser.ts` | Ekte auth venter på auth-videoen i webappen. Main har ingen auth ennå (`requireUser` er kommentert ut). |
| 5. Dyplenker | `+not-found.tsx` og `anchor` i alle stacker | Steg 10 | – |
| 6. Tester | vitest-native for `api/tasks.ts` med `fetch` mocket, og Playwright mot web med webappen mocket med `page.route` | `src/api/tasks.test.ts` og `e2e/navigation.spec.ts` | devDependencies: `vitest`, `vitest-native`, `@testing-library/react-native` og `@playwright/test` |

Valgfri oppgave i webappen: gjør ferdig `controller.action` (`POST /api/v1/tasks/:id/complete` gir 500 i dag), og bruk den fra appen i stedet for PATCH.

Til sammenligning har react-native-kurset i ulearn-lms denne rekkefølgen: tabs (14), context (22), auth (23–24), API (25), TanStack Query (26), mutations (27), testing (30).
