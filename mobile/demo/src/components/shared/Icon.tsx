import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

type IconProps = {
  ios: Extract<SymbolViewProps["name"], string>;
  android: NonNullable<Extract<SymbolViewProps["name"], object>["android"]>;
  color: ColorValue;
  size?: number;
};

export function Icon({ color, size = 24, ios, android }: IconProps) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      tintColor={color}
      size={size}
    />
  );
}
