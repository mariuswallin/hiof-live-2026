import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "@/constants/theme";

type CardProps = {
  title: string;
  children: ReactNode;
};

/** Hvit boks med overskrift. Brukes for å dele opp skjermene i seksjoner. */
export function Card({ title, children }: CardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.surface,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: "600",
    color: Theme.text,
  },
});
