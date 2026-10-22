/**
 * Ett sted for alle designverdier.
 *
 * Hvorfor: React Native har ingen CSS-variabler eller cascade. Uten et felles
 * tema ender vi opp med hardkodede "#fff" og "padding: 12" spredt utover alle
 * komponenter, og da er det umulig å endre uttrykket ett sted. Alle
 * StyleSheet-objekter i appen leser fra dette objektet.
 */
export const Theme = {
  // Farger
  primary: "#1565c0",
  primaryLight: "#e3f2fd",
  secondary: "#1976d2",
  contrast: "#ffb300",
  danger: "#d32f2f",
  success: "#388e3c",
  muted: "#6b7280",
  border: "#d1d5db",
  background: "#f5f7fa",
  surface: "#ffffff",
  text: "#111827",
  textInverted: "#ffffff",

  // Avstander. Faste trinn gir jevn rytme i UI-et.
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },

  // Hjørneradius
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },

  // Skriftstørrelser
  fontSize: {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 24,
  },
} as const;
