# Steg 1: slett mot webappen

**Mål:** en Slett-knapp på hver rad, som sletter optimistisk via `removeApi`.

**Flyt:** `src/app/index.tsx` → `TaskList.tsx` → `TaskItem.tsx`

> ⚠️ **Obs: iOS og Android.** PATCH og DELETE bruker samme `BASE_URL` (`localhost`) som i steg 0. Dette er bare testet i iOS-simulatoren. Android-emulatoren trenger `10.0.2.2`, og en fysisk telefon trenger Mac-ens IP. Se tabellen i `steg-0.md`, og nevn at dette må testes.

## 1. `src/app/index.tsx`

- Hent `removeApi` fra `useTasks()`.
- `handleRemove(id)` bruker samme `try/catch` som `handleToggle`, og feil havner i `saveError`.
- `TaskList` får `onRemove={handleRemove}`.

## 2. `src/components/tasks/TaskList.tsx`

- Ny prop `onRemove`, som bare sendes videre til hver `TaskItem`.

## 3. `src/components/tasks/TaskItem.tsx`

- Ny prop `onRemove`, og en Slett-knapp som er en `Pressable` inni raden. Den innerste vinner trykket.
- Ny `styles.remove` (`Theme.danger`).

## Prinsipp å vise

- **Props eller context:** komponenten sier bare ifra, og forelderen bestemmer hva som skjer og viser feilen.

### Kommentar: kunne vi brukt context direkte?

Ja. `onRemove` går gjennom `TaskList` bare for å nå `TaskItem` (prop drilling). `TaskItem` kunne hentet den selv:

```tsx
const { removeApi } = useTasks();
<Pressable onPress={() => removeApi(id)}>
```

`TaskItem` bruker allerede `useTasks()` til `tasks.length`, så det er ikke noe nytt.

| | Props (slik vi gjør) | Context direkte |
|---|---|---|
| Hvem bestemmer | forelderen (`index.tsx`) | `TaskItem` selv |
| Feilmelding | `saveError` i `index.tsx` virker som før | må flyttes: egen state i raden, eller `saveError` i contexten |
| Gjenbruk og test | `TaskItem` kan brukes uten provider | krever `TasksProvider` rundt |
| Mellomledd | `TaskList` må sende videre | `TaskList` slipper |

Det er nettopp dette som var feilen med toggle fra demo: `TaskItem` kalte `toggle()` fra contexten og ignorerte `onToggle`, så forelderen kunne ikke velge API eller vise feil. Context er greit når **alle** som bruker komponenten skal gjøre det samme. Props er bedre når forelderen skal bestemme.

Tommelfingerregel: én eller to nivåer med props er greit. Blir det dypere, eller trenger mange komponenter det samme, er context riktig.

## Test

1. Trykk på en rad. Haken kommer et lite øyeblikk etter trykket. Trykk `r`, og statusen er den samme.
2. Trykk «Slett». Raden er borte med en gang, mens serveren bruker 1 sekund. Trykk `r`, og den er fortsatt borte.
3. Slett noen ganger til du får «Tilfeldig feil (demo). Prøv igjen.» i rødt. Raden kommer da tilbake.
4. Slett alle oppgavene. Skjemaet er der fortsatt, og «No tasks available» vises.

## Kjent i dette steget

På **web** bobler klikket på «Slett» videre til raden, så den toggler også. I iOS-simulatoren vinner den innerste `Pressable`, så der er det ikke et problem. Det ryddes i steg 2.

---

## Kommentar: kulere splash screen (valgfritt)

Bakgrunn: se kommentaren nederst i `steg-0.md`. Med 1,5 sekunder delay på GET i webappen trengs `minTimePassed` under egentlig ikke. Den står der i tilfelle delayen fjernes.

### Hvor den kommer inn

1. **Native splash** (`app.json`, pluginen `expo-splash-screen`): blå `#208AEF` og `splash-icon.png`. Den vises mens JS lastes, og trenger ingen kode.
2. **`<Splash />` i `RootNavigator`** (`_layout.tsx`): samme farge og bilde, så overgangen er usynlig, men nå animert. Den vises til auth **og** tasks er lastet, og minst 1,5 sekunder.
3. **`Stack`**, som viser forsiden.

Konsekvens: `isLoading` er alltid `false` når forsiden vises. Da kan `<Loading label="Henter oppgaver fra webappen ..." />` i `index.tsx` fjernes. `error` må stå igjen.

Animasjonene er CSS-animasjoner i Reanimated 4 (`animationName` med `from`/`to`). Det er samme idé som `@keyframes` i webappen. `react-native-reanimated` er allerede installert.

### `src/components/shared/Splash.tsx` (ny)

```tsx
import { Theme } from "@/constants/theme";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

// Samme farge og bilde som expo-splash-screen i app.json, så overgangen fra
// den native splashen til denne er usynlig.
const SPLASH_BACKGROUND = "#208AEF";

// Keyframes som i CSS: Reanimated 4 animerer stilen fra "from" til "to".
const pulse = {
  from: { transform: [{ scale: 1 }] },
  to: { transform: [{ scale: 1.12 }] },
};

const ripple = {
  from: { opacity: 0.5, transform: [{ scale: 0.8 }] },
  to: { opacity: 0, transform: [{ scale: 2.4 }] },
};

const fadeUp = {
  from: { opacity: 0, transform: [{ translateY: 12 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};

type SplashProps = {
  label?: string;
};

export function Splash({ label = "Henter oppgaver ..." }: SplashProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Animated.View
          style={[
            styles.ripple,
            {
              animationName: ripple,
              animationDuration: "1600ms",
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-out",
            },
          ]}
        />
        <Animated.Image
          source={require("@/assets/images/splash-icon.png")}
          style={[
            styles.logo,
            {
              animationName: pulse,
              animationDuration: "800ms",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              animationTimingFunction: "ease-in-out",
            },
          ]}
        />
      </View>

      <Animated.Text
        style={[
          styles.title,
          {
            animationName: fadeUp,
            animationDuration: "600ms",
            animationFillMode: "both",
          },
        ]}
      >
        Tasks
      </Animated.Text>
      <Animated.Text
        style={[
          styles.label,
          {
            animationName: fadeUp,
            animationDuration: "600ms",
            animationDelay: "300ms",
            animationFillMode: "both",
          },
        ]}
      >
        {label}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.md,
    backgroundColor: SPLASH_BACKGROUND,
  },
  logoArea: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Theme.textInverted,
  },
  logo: {
    // 76 = imageWidth i app.json. 228x213 er bildets egne mål.
    width: 76,
    aspectRatio: 228 / 213,
  },
  title: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.xl,
    fontWeight: "700",
  },
  label: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.md,
  },
});
```

### `src/app/_layout.tsx`

```diff
-import { Loading } from "@/components/shared/Loading";
+import { Splash } from "@/components/shared/Splash";
 import { Theme } from "@/constants/theme";
 import { AuthProvider, useAuth } from "@/contexts/AuthContext";
-import { TasksProvider } from "@/contexts/TasksContext";
+import { TasksProvider, useTasks } from "@/contexts/TasksContext";
 import { Stack } from "expo-router";
-import { View } from "react-native";
+import { useEffect, useState } from "react";

 function RootNavigator() {
   const { isLoading, isAdmin } = useAuth();
+  // RootNavigator ligger INNI TasksProvider (se RootLayout), så useTasks virker her.
+  const { isLoading: isLoadingTasks } = useTasks();
+  // Bare for demo: localhost svarer så fort at splashen ellers bare blinker.
+  // I en ekte app venter vi ikke med vilje.
+  const [minTimePassed, setMinTimePassed] = useState(false);
+
+  useEffect(() => {
+    const timer = setTimeout(() => setMinTimePassed(true), 1500);
+    return () => clearTimeout(timer);
+  }, []);

-  if (isLoading) {
-    return (
-      <View>
-        <Loading />
-      </View>
-    );
-  }
+  if (isLoading || isLoadingTasks || !minTimePassed) {
+    return <Splash />;
+  }
```

### Test

1. Trykk `r`. Den blå native splashen går over i den animerte uten at du ser et hopp: logoen pulserer, ringen sprer seg, og teksten glir opp.
2. Etter cirka 1,5 sekunder vises forsiden med lista, uten noen «Henter oppgaver ...» der.
3. Stopp webappen og trykk `r`. Splashen vises, og deretter forsiden med «Network request failed».
