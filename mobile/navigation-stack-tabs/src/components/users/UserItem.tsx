import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import type { User } from "@/api/dummy-json";
import { Icon } from "@/components/shared/Icon";
import { UserInfo } from "@/components/users/UserInfo";
import { Theme } from "@/constants/theme";

type UserItemProps = {
  user: User;
};

/**
 * Én rad i /users-lista. Samme oppbygning som TaskItem: hele raden er en
 * <Link asChild> til detaljsiden, med ">" til høyre.
 *
 * id-en er et TALL i API-et, men URL-parametere er alltid strenger -
 * derfor String(user.id).
 */
export function UserItem({ user }: UserItemProps) {
  return (
    <Link
      href={{ pathname: "/users/[userId]", params: { userId: String(user.id) } }}
      asChild
    >
      {/* Vanlig style-objekt, ikke en funksjon - se kommentaren i TaskItem. */}
      <Pressable
        style={styles.container}
        accessibilityLabel={`Åpne ${user.firstName} ${user.lastName}`}
      >
        <View style={styles.info}>
          <UserInfo user={user} />
        </View>
        <Icon
          ios="chevron.right"
          android="chevron_right"
          color={Theme.muted}
          size={18}
        />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  // Samme ramme som raden i TaskItem.
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.surface,
  },
  info: {
    flex: 1,
  },
});
