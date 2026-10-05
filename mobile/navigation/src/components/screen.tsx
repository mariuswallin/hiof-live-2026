import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { Theme } from "@/constants/theme";

/**
 * Enkel ramme for skjermene. I demo-appen tegnet TaskLayout sin egen header
 * og vi brukte SafeAreaView. Nå tegner NAVIGATOREN headeren (og tab-baren),
 * og tar hensyn til notch/hjem-indikator selv - så vi trenger bare innholdet.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      // Lar iOS legge innholdet riktig under en gjennomsiktig header.
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    gap: Theme.spacing.md,
    padding: Theme.spacing.lg,
  },
});
