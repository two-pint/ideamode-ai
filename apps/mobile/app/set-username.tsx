import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export default function SetUsernameScreen() {
  const router = useRouter();
  const { token, user, setAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token || !user) {
    return null;
  }

  async function handleSubmit() {
    const authToken = token;
    if (!authToken) return;
    const u = username.trim().toLowerCase();
    if (!u) {
      setError("Username is required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const check = await authApi.checkUsername(u);
      if (!check.available) {
        setError(check.error || "Username not available");
        return;
      }
      const res = await authApi.setUsername(authToken, u);
      await setAuth(authToken, res.user);
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <Text style={styles.title}>Choose a username</Text>
        <Text style={styles.sub}>This appears in your URLs: /{username || "username"}/…</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          placeholder="your-handle"
          placeholderTextColor={theme.subtleForeground}
        />
        <Pressable
          style={[styles.button, loading && styles.disabled]}
          onPress={() => void handleSubmit()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: theme.background,
    justifyContent: "center",
  },
  card: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    backgroundColor: theme.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: "600", color: theme.foreground, marginBottom: 8 },
  sub: { fontSize: 14, color: theme.mutedForeground, marginBottom: 20, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: theme.input,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.card,
    marginBottom: 16,
    color: theme.foreground,
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: theme.primaryForeground, fontSize: 16, fontWeight: "600" },
  error: { color: theme.destructive, marginBottom: 12, fontSize: 14 },
});
