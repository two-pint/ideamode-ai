/**
 * Semantic colors aligned with `apps/web/app/globals.css` (`:root` and `.dark`).
 * Use `useTheme()` from `@/lib/theme-context` so UI follows system light/dark.
 */
export const lightTheme = {
  background: "#fafafa",
  foreground: "#18181b",
  card: "#ffffff",
  cardForeground: "#18181b",
  muted: "#f4f4f5",
  mutedForeground: "#71717a",
  subtleForeground: "#a1a1aa",
  border: "#e4e4e7",
  input: "#e4e4e7",
  primary: "#18181b",
  primaryForeground: "#fafafa",
  destructive: "#dc2626",
  secondary: "#f4f4f5",
  secondaryForeground: "#18181b",
  badgeBrainstormBg: "#d1fae5",
  badgeBrainstormText: "#065f46",
  badgeIdeaBg: "#ede9fe",
  badgeIdeaText: "#5b21b6",
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
} as const;

export const darkTheme = {
  background: "#09090b",
  foreground: "#fafafa",
  card: "#18181b",
  cardForeground: "#fafafa",
  muted: "#27272a",
  mutedForeground: "#a1a1aa",
  subtleForeground: "#71717a",
  border: "#3f3f46",
  input: "#3f3f46",
  primary: "#fafafa",
  primaryForeground: "#18181b",
  destructive: "#dc2626",
  secondary: "#27272a",
  secondaryForeground: "#fafafa",
  badgeBrainstormBg: "#064e3b",
  badgeBrainstormText: "#a7f3d0",
  badgeIdeaBg: "#4c1d95",
  badgeIdeaText: "#e9d5ff",
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
} as const;

export type AppTheme = typeof lightTheme | typeof darkTheme;

export function getHeaderScreenOptions(theme: AppTheme) {
  return {
    headerStyle: {
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerShadowVisible: false,
    headerTintColor: theme.foreground,
    headerTitleStyle: {
      fontWeight: "600" as const,
      color: theme.foreground,
      fontSize: 17,
    },
  };
}
