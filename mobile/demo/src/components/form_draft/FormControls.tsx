import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { Theme } from "@/constants/theme";

/**
 * Felles "dumme" byggeklosser for de tre TaskRegister-variantene.
 *
 * De eier INGEN state og vet ingenting om validering. Da blir forskjellen
 * mellom variantene bare det som faktisk er forskjellig: hvor state bor og
 * hvordan feil regnes ut.
 */

type FormCardProps = {
  title: string;
  children: ReactNode;
};

export function FormCard({ title, children }: FormCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * Props:
 * - label: tekst over feltet.
 * - error: tom streng / undefined = ingen feil.
 * - resten sendes rett videre til TextInput (value, onChangeText, onBlur ...).
 *   `...inputProps` gjør at vi slipper å liste opp hver eneste prop.
 */
type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        placeholderTextColor={Theme.muted}
        style={[styles.input, hasError && styles.inputError]}
      />
      {hasError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

type SubmitButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function SubmitButton({ label, onPress, disabled }: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Theme.spacing.md,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.surface,
  },
  cardTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: "600",
    color: Theme.text,
  },
  field: {
    gap: Theme.spacing.xs,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    fontWeight: "600",
    color: Theme.muted,
  },
  input: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.sm,
    fontSize: Theme.fontSize.md,
    color: Theme.text,
    backgroundColor: Theme.surface,
  },
  inputError: {
    borderColor: Theme.danger,
  },
  error: {
    fontSize: Theme.fontSize.sm,
    color: Theme.danger,
  },
  button: {
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.primary,
  },
  buttonDisabled: {
    backgroundColor: Theme.muted,
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
