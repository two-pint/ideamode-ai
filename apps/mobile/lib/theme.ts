/**
 * Semantic colors aligned with `apps/web/app/globals.css` (light / small-viewport parity).
 */
export const theme = {
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
  /** Secondary button surface (matches shadcn `secondary` / zinc-100) */
  secondary: "#f4f4f5",
  secondaryForeground: "#18181b",
  /** Resource badges — match web `Badge` brainstorm / idea */
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

export const headerScreenOptions = {
  headerStyle: {
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerShadowVisible: false,
  headerTintColor: theme.foreground,
  headerTitleStyle: { fontWeight: "600" as const, color: theme.foreground, fontSize: 17 },
};
