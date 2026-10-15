import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Card } from "@/components/shared/Card";
import { Loading } from "@/components/shared/Loading";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * "/settings" - ligger rett i app/, altså i rot-Stacken og IKKE i (tabs)/.
 *
 * Derfor: ingen tab-bar her. Skjermen legges oppå tabs, og rot-Stackens
 * header vises - med tilbake-knapp, fordi det finnes noe under.
 *
 * Brukeren kommer fra en CUSTOM HOOK (useCurrentUser), ikke fra
 * AuthContext. Skjermen fjernes når du går tilbake, så hver gang du åpner
 * den, hentes brukeren på nytt. Sammenlign med Profil, som bruker useAuth().
 */
export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const { user } = useCurrentUser();

  return (
    <Screen>
      <Card title="Konto (custom hook)">
        {user ? (
          <Text style={styles.text}>
            {user.firstName} {user.lastName} ({user.role})
          </Text>
        ) : (
          <Loading label="Henter bruker ..." />
        )}
      </Card>

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
