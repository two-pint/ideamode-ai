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
    <View style={styles.container}>
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
        placeholderTextColor="#a1a1aa"
      />
      <Pressable
        style={[styles.button, loading && styles.disabled]}
        onPress={() => void handleSubmit()}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 48, backgroundColor: "#fafafa" },
  title: { fontSize: 22, fontWeight: "700", color: "#18181b", marginBottom: 8 },
  sub: { fontSize: 14, color: "#71717a", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
    color: "#18181b",
  },
  button: {
    backgroundColor: "#18181b",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#b91c1c", marginBottom: 12 },
});
