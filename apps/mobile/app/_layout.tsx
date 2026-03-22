import { Stack } from "expo-router";
import { useMemo } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { getHeaderScreenOptions } from "@/lib/theme";

function ThemedStack() {
  const theme = useTheme();
  const screenOptions = useMemo(() => getHeaderScreenOptions(theme), [theme]);
  return (
    <Stack screenOptions={screenOptions}>
      {/* Route group name `(tabs)` is not a URL segment; without this, the root Stack shows
          "(tabs)" above the tab navigator’s own header (double header). `title` fixes the iOS
          back label when pushing detail screens on top of tabs. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "IdeaMode" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
