import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Theme } from "@/constants/theme";

/**
 * "/settings" - ligger i (drawer)/ men IKKE i (tabs)/.
 *
 * Derfor: ingen tab-bar her. Skuffens egen header vises (med ☰), fordi vi
 * ikke har skjult den for denne skjermen i (drawer)/_layout.tsx.
 */
export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);

  return (
    <Screen>
      <Card title="Varsler">
        <View style={styles.row}>
          <Text style={styles.text}>Påminnelser</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  text: {
    fontSize: Theme.fontSize.md,
    color: Theme.text,
  },
});
