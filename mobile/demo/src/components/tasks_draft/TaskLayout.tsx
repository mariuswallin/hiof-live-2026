import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "@/constants/theme";

/**
 * Props:
 * - title:    overskriften øverst.
 * - subtitle: valgfri undertekst.
 * - children: ALT som puttes MELLOM <TaskLayout> og </TaskLayout>.
 *             Dette er Reacts måte å lage "hull" i en komponent på:
 *             layouten bestemmer rammen, forelderen bestemmer innholdet.
 *             Typen ReactNode dekker JSX, tekst, arrays, null osv.
 * - footer:   et NAVNGITT hull. Når vi trenger flere hull enn ett, sender vi
 *             JSX inn som en vanlig prop i stedet for children.
 */
type TaskLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function TaskLayout({
  title,
  subtitle,
  children,
  footer,
}: TaskLayoutProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {/* TODO (demo): her plasseres children og footer */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1 = fyll hele skjermen. Uten dette får ikke lista under
    // noen høyde å scrolle innenfor.
    flex: 1,
    backgroundColor: Theme.background,
  },
  header: {
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: "700",
    color: Theme.text,
  },
  subtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.muted,
  },
  // Wrapper rundt children
  body: {
    flex: 1,
  },
  footer: {
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    backgroundColor: Theme.surface,
  },
});
