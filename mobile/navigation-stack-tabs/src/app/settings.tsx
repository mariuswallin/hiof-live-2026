import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Card } from "@/components/shared/Card";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";

/**
 * "/settings" - ligger rett i app/, altså i rot-Stacken og IKKE i (tabs)/.
 *
 * Derfor: ingen tab-bar her. Skjermen legges oppå tabs, og rot-Stackens
 * header vises - med tilbake-knapp, fordi det finnes noe under.
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
