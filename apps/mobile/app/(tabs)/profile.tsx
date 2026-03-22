import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import type { AppTheme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.name || "—"}</Text>
        <Text style={styles.username}>@{user.username || "…"}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.outlineButton, pressed && { opacity: 0.92 }]}
        onPress={() => router.push("/invitations")}
      >
        <Text style={styles.outlineButtonText}>Invitations</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.92 }]}
        onPress={() => void handleLogout()}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background, padding: 16 },
    card: {
      backgroundColor: theme.card,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      marginBottom: 16,
    },
    name: { fontSize: 20, fontWeight: "600", color: theme.foreground, letterSpacing: -0.2 },
    username: { fontSize: 15, color: theme.mutedForeground, marginTop: 4 },
    bio: { fontSize: 15, color: theme.foreground, marginTop: 16, lineHeight: 22, opacity: 0.9 },
    email: { fontSize: 14, color: theme.mutedForeground, marginTop: 12 },
    outlineButton: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: theme.card,
    },
    outlineButtonText: { fontSize: 15, fontWeight: "600", color: theme.foreground },
    signOut: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: theme.card,
    },
    signOutText: { fontSize: 15, fontWeight: "600", color: theme.foreground },
  });
}
