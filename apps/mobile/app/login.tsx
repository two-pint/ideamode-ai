import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { IdeaModeLogo } from "@/components/ideamode-logo";
import { ApiError, API_URL, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ login: login.trim(), password });
      if (!res?.token || !res?.user) {
        setError("Invalid response from server.");
        return;
      }
      await setAuth(res.token, res.user);
      router.replace(res.user.username ? "/(tabs)" : "/set-username");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ path: "auth/callback" });
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/auth/google`,
        redirectUri,
      );
      if (result.type === "cancel" || result.type === "dismiss") {
        return;
      }
      if (result.type !== "success" || !("url" in result) || !result.url) {
        setError("Google sign-in did not complete.");
        return;
      }
      const url = new URL(result.url);
      const err = url.searchParams.get("error");
      if (err) {
        setError(err);
        return;
      }
      const code = url.searchParams.get("code");
      if (!code) {
        setError(
          "No authorization code returned. Set API FRONTEND_URL to match this app’s redirect URI (see README).",
        );
        return;
      }
      const exchanged = await authApi.exchangeCode(code);
      await setAuth(exchanged.token, exchanged.user);
      router.replace(exchanged.user.username ? "/(tabs)" : "/set-username");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <IdeaModeLogo width={140} height={21} />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Email or username</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            value={login}
            onChangeText={setLogin}
            placeholder="you@example.com"
            placeholderTextColor={theme.subtleForeground}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.subtleForeground}
          />

          <Pressable
            style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={() => void handlePasswordLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.primaryForeground} />
            ) : (
              <Text style={styles.buttonPrimaryText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>or</Text>
            <View style={styles.separatorLine} />
          </View>

          <Pressable
            style={[styles.buttonOutline, loading && styles.buttonDisabled]}
            onPress={() => void handleGoogle()}
            disabled={loading}
          >
            <Text style={styles.buttonOutlineText}>Continue with Google</Text>
          </Pressable>

          <Text style={styles.hint}>
            Google sign-in requires the API’s FRONTEND_URL to match Expo’s redirect (e.g. exp://… or
            ideamode://).
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 40,
    justifyContent: "center",
    alignItems: "stretch",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: theme.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoWrap: { alignItems: "center", marginBottom: 4 },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.foreground,
    marginTop: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.mutedForeground,
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.foreground,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.input,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: theme.card,
    marginBottom: 16,
    color: theme.foreground,
  },
  buttonPrimary: {
    backgroundColor: theme.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPrimaryText: { color: theme.primaryForeground, fontSize: 15, fontWeight: "600" },
  buttonOutline: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: theme.card,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonOutlineText: { color: theme.foreground, fontSize: 15, fontWeight: "600" },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: theme.border },
  separatorText: { fontSize: 12, color: theme.mutedForeground },
  error: { color: theme.destructive, marginBottom: 12, textAlign: "center", fontSize: 14 },
  hint: {
    fontSize: 12,
    color: theme.mutedForeground,
    marginTop: 20,
    textAlign: "center",
    lineHeight: 18,
  },
});
