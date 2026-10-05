import { defineConfig } from "vitest/config";
import { reactNative } from "vitest-native";

/**
 * Vitest + React Native.
 *
 * reactNative() fra vitest-native kjører EKTE React Native-JavaScript i Node
 * (samme kode som i appen), og mocker bare grensen mot native-koden
 * (kamera, sensorer, native views ...). Ingen jest.setup, ingen presets.
 *
 * Kjør: pnpm test        (én gang)
 *       pnpm test:watch  (kjører på nytt når du lagrer)
 */
export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    // Samme "@/..."-snarvei som i tsconfig.json.
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    // Enhets- og komponenttester ligger ved siden av koden (*.test.ts[x]).
    // e2e/ kjøres av Playwright, ikke Vitest.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
