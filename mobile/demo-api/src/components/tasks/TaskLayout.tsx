import { Text, View } from "react-native";

export function TaskLayout({ children }: { children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ fontWeight: "bold", fontSize: 22 }}>Task Layout</Text>
      {children}
    </View>
  );
}
