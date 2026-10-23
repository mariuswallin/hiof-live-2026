// STEG 2: NY - brukes av tab-ikonene i app/(tabs)/_layout.tsx.

import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

/**
 * STEG 2: liten wrapper rundt SymbolView (expo-symbols, finnes allerede i
 * package.json), så hvert tab-ikon blir én linje.
 *
 * - ios:     SF Symbols (Apples ikoner)
 * - android: Material Symbols - brukes også på web
 */
type IconProps = {
  ios: Extract<SymbolViewProps["name"], string>;
  android: NonNullable<Extract<SymbolViewProps["name"], object>["android"]>;
  color: ColorValue;
  size?: number;
};

export function Icon({ ios, android, color, size = 24 }: IconProps) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      tintColor={color}
      size={size}
    />
  );
}
