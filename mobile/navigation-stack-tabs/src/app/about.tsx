import { StyleSheet, Text } from "react-native";

import { Card } from "@/components/shared/Card";
import { Screen } from "@/components/shared/Screen";
import { Theme } from "@/constants/theme";

/** "/about" - enda en skjerm i rot-Stacken, utenfor tabs (som settings.tsx). */
export default function AboutScreen() {
  return (
    <Screen>
      <Card title="Oppgaver - navigasjon">
        <Text style={styles.text}>
          Samme oppgave-app som i demo-prosjektet, men nå delt opp i skjermer
          med bare to navigatorer: tabs og stack.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: Theme.fontSize.md,
    color: Theme.text,
    lineHeight: 20,
  },
});
