import { Redirect } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import type { AppTheme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

export default function Index() {
  const { token, user, loading } = useAuth();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  if (!user?.username) {
    return <Redirect href="/set-username" />;
  }

  return <Redirect href="/(tabs)" />;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
    },
  });
}
