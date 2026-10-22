import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

import { Theme } from "@/constants/theme";

type LoadingProps = {
  label?: string;
};

export function Loading({ label = "Laster..." }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Theme.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // alignSelf i stedet for flex: 1 - boksen skal ta plassen den trenger,
    // også når den ligger inne i en ScrollView uten fast høyde.
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.md,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.primaryLight,
  },
  text: {
    fontSize: Theme.fontSize.md,
    color: Theme.primary,
    fontWeight: "bold",
  },
});
