import { Pressable, StyleSheet, Text, View } from "react-native";

import { Theme } from "@/constants/theme";

type EmptyProps = {
  title: string;
  hint?: string;
  /** Valgfri handling. Uten den vises ingen knapp. */
  actionLabel?: string;
  onPress?: () => void;
};

export function Empty({ title, hint, actionLabel, onPress }: EmptyProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{actionLabel ?? "Prøv igjen"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // alignSelf i stedet for flex: 1 - boksen tar plassen den trenger, og
    // fungerer også når den ligger inne i en liste uten fast høyde.
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.surface,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    color: Theme.text,
    fontWeight: "600",
  },
  hint: {
    fontSize: Theme.fontSize.md,
    color: Theme.muted,
    textAlign: "center",
  },
  button: {
    marginTop: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.primary,
  },
  pressed: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.md,
    fontWeight: "700",
  },
});
