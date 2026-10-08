import { Pressable, StyleSheet, Text } from "react-native";

import { Theme } from "@/constants/theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** Rød knapp for handlinger som sletter noe. */
  danger?: boolean;
  disabled?: boolean;
};

/** Blå (eller rød) knapp med full bredde. Brukes på detalj-, profil- og admin-siden. */
export function Button({ label, onPress, danger, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        danger && styles.buttonDanger,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.primary,
  },
  buttonDanger: {
    backgroundColor: Theme.danger,
  },
  dimmed: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.textInverted,
    fontSize: Theme.fontSize.md,
    fontWeight: "700",
  },
});
