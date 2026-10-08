import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { User } from "@/api/dummy-json";
import { Theme } from "@/constants/theme";

type UserInfoProps = {
  user: User;
};

/**
 * Bilde, navn og e-post for én bruker fra dummyjson.
 *
 * Samme bruker vises flere steder i rutetreet, så utseendet bor her:
 * - /tasks/user/[userId]  eier av en oppgave (inne i Oppgaver-taben)
 * - /users/[userId]       brukerens egen side (utenfor tabs)
 * - /users                hver rad i lista (via UserItem)
 *
 * Komponenten henter ingenting selv - skjermen gir den brukeren.
 */
export function UserInfo({ user }: UserInfoProps) {
  return (
    <View style={styles.row}>
      <Image source={user.image} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.muted}>{user.email}</Text>
        <Text style={styles.muted}>userId: {user.id}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.primaryLight,
  },
  info: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  name: {
    fontSize: Theme.fontSize.lg,
    fontWeight: "600",
    color: Theme.text,
  },
  muted: {
    fontSize: Theme.fontSize.sm,
    color: Theme.muted,
  },
});
