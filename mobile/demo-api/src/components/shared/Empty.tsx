import { Theme } from "@/constants/theme";
import { View, Text, StyleSheet, Pressable } from "react-native";

interface EmptyProps {
  title: string;
  hint?: string;
  onPress: ({ message, id }: { message: string; id: number }) => void;
}

export function Empty({ title, hint, onPress }: EmptyProps) {
  function whenPressed() {
    console.log("Pressed");
    onPress({
      message: "Hello from Empty.tsx",
      id: 123,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={whenPressed}>
        <Text style={styles.button}>Trykk her</Text>
      </Pressable>
      {hint ? <Text>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: "pink",
    width: "80%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    color: Theme.text,
    fontWeight: "600",
  },
  button: {
    padding: Theme.spacing.sm,
    backgroundColor: "red",
    fontSize: Theme.fontSize.xl,
    fontWeight: "900",
  },
});
