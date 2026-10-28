import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Card } from "@/components/shared/Card";
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
 * AuthContext. Hooken gir skjermen sin EGEN state - og der har ingen logget
 * inn. Innloggingen fra /login ligger i AuthProvider. Sammenlign med Profil,
 * som bruker useAuth().
 *
 * Prøv: bytt useCurrentUser() med useAuth() (fra "@/contexts/AuthContext"),
 * så ser du brukeren her også.
 */
export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const { user } = useCurrentUser();

  return (
    <Screen>
      <Card title="Konto (custom hook)">
        {user ? (
          <Text style={styles.text}>
            {user.name} ({user.role})
          </Text>
        ) : (
          <Text style={styles.muted}>
            Ingen innlogget - i denne skjermens egen kopi. Profil leser
            innloggingen fra AuthProvider og ser den.
          </Text>
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
  muted: {
    fontSize: Theme.fontSize.md,
    color: Theme.muted,
  },
});
