# Steg 0: liste og opprett mot webappen

**Mål:** lista hentes fra webappen, og nye oppgaver lagres der. Skjemaet vises også når lista er tom.

**Forutsetning:** webappen kjører (`npm run dev` i `hiof-live-2026/webapp/tasks`), og http://localhost:5173/api/v1/tasks svarer.

Alt i steg 0 er ferdig i `hiof-live-2026/mobile/demo`.

Webappen har fått et tregt API: `await demoDelay(request, 1500)` i `list` (`webapp/tasks/src/features/tasks/task-controller.ts`). Endringen er ucommittet.

## ⚠️ Obs: iOS og Android bruker ulik URL (nevn dette, og at det må testes)

`BASE_URL` i `src/api/tasks.ts` er `http://localhost:5173/api/v1`. «localhost» betyr maskinen koden kjører på:

| Hvor appen kjører | URL | Virker nå? |
|---|---|---|
| iOS-simulator | `http://localhost:5173/api/v1` (simulatoren kjører på Mac-en) | ✅ testet |
| Android-emulator | `http://10.0.2.2:5173/api/v1` (10.0.2.2 er Mac-en sett fra emulatoren) | ❌ ikke testet |
| Fysisk telefon (Expo Go) | `http://<Mac-ens IP>:5173/api/v1`, og webappen må startes med `npm run dev -- --host` | ❌ ikke testet |
| Web | Nettleseren stopper kallet (CORS), fordi webappen ikke tillater andre opphav | ❌ |

Mulig løsning for emulatorene: `Platform.OS === "android" ? "http://10.0.2.2:5173/api/v1" : "http://localhost:5173/api/v1"`.

## Test

1. Trykk `r`. «Henter oppgaver fra webappen ...» vises i cirka 1,5 sekunder, og så kommer lista. «Antall tasks» stemmer med `/api/v1/tasks`.
2. Registrer en oppgave. Den havner øverst, og http://localhost:5173/tasks viser den også.
3. Trykk `r` i Expo-terminalen. Oppgaven er der fortsatt.
4. Registrer med bare mellomrom. «Tittel kan ikke være tom» vises i rødt, og meldingen kommer fra serveren.
5. Stopp webappen og trykk `r`. «Network request failed» vises.
6. Er webappen tom, vises både skjemaet og «No tasks available».

---

## Kommentar: hvorfor «Henter oppgaver fra webappen ...» trengte en delay

Teksten står i `index.tsx` (`isLoading ? <Loading ... /> : null`). Uten delay i webappen rakk den ikke å vises:

- `GET /api/v1/tasks` hadde ingen `demoDelay`, så localhost svarte på noen få millisekunder.
- `TasksProvider` ligger i `_layout.tsx` og starter hentingen når appen starter. Når forsiden vises, var hentingen nesten eller helt ferdig.
- Lista hentes bare én gang (`useEffect(..., [])` i provideren). Å navigere tilbake til forsiden henter den ikke på nytt. Du ser den derfor bare ved oppstart eller `r`.

Med 1,5 sekunder delay vises den. Den slås av når requesten har `x-demo-chaos: off` (Playwright gjør det), og den virker bare med `npm run dev`.

Obs: `TaskList` vises også mens appen laster, så du ser laste-teksten, skjemaet og «No tasks available» samtidig. Mener du «enten laster eller lista», endrer du `index.tsx` til `isLoading ? <Loading ... /> : <TaskList ... />`.

Med splash screen (kommentaren nederst i `steg-1.md`) vises ikke denne teksten lenger, fordi splashen dekker hentingen.
