import * as AuthSession from "expo-auth-session"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native"
import * as WebBrowser from "expo-web-browser"
import { Lightbulb } from "lucide-react-native"
import { ApiError, API_URL, authApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { renderLucide } from "@/lib/render-lucide"

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordLogin() {
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.login({ login: login.trim(), password })
      if (!res?.token || !res?.user) {
        setError("Invalid response from server.")
        return
      }
      await setAuth(res.token, res.user)
      router.replace(res.user.username ? "/(tabs)" : "/set-username")
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
      else setError(e instanceof Error ? e.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      const redirectUri = AuthSession.makeRedirectUri({ path: "auth/callback" })
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/auth/google`,
        redirectUri,
      )
      if (result.type === "cancel" || result.type === "dismiss") {
        return
      }
      if (result.type !== "success" || !("url" in result) || !result.url) {
        setError("Google sign-in did not complete.")
        return
      }
      const url = new URL(result.url)
      const err = url.searchParams.get("error")
      if (err) {
        setError(err)
        return
      }
      const code = url.searchParams.get("code")
      if (!code) {
        setError(
          "No authorization code returned. Set API FRONTEND_URL to match this app’s redirect URI (see README).",
        )
        return
      }
      const exchanged = await authApi.exchangeCode(code)
      await setAuth(exchanged.token, exchanged.user)
      router.replace(exchanged.user.username ? "/(tabs)" : "/set-username")
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
      else setError(e instanceof Error ? e.message : "Google sign-in failed")
    } finally {
      setLoading(false)
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
        {renderLucide(Lightbulb, { size: 40, color: "#18181b" })}
        <Text style={styles.title}>IdeaMode</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Email or username</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={login}
          onChangeText={setLogin}
          placeholder="you@example.com"
          placeholderTextColor="#a1a1aa"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#a1a1aa"
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => void handlePasswordLogin()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>

        <Text style={styles.or}>or</Text>

        <Pressable
          style={[styles.buttonOutline, loading && styles.buttonDisabled]}
          onPress={() => void handleGoogle()}
          disabled={loading}
        >
          <Text style={styles.buttonOutlineText}>Continue with Google</Text>
        </Pressable>

        <Text style={styles.hint}>
          Google sign-in requires the API’s FRONTEND_URL to match Expo’s
          redirect (e.g. exp://… or ideamode://).
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  scroll: {
    padding: 24,
    paddingTop: 48,
    alignItems: "stretch",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#18181b",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#52525b",
    marginBottom: 24,
    textAlign: "center",
  },
  label: { fontSize: 13, fontWeight: "500", color: "#3f3f46", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  buttonOutline: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  buttonOutlineText: { color: "#18181b", fontSize: 16, fontWeight: "600" },
  or: { textAlign: "center", color: "#71717a", marginVertical: 16 },
  error: { color: "#b91c1c", marginBottom: 12, textAlign: "center" },
  hint: {
    fontSize: 11,
    color: "#a1a1aa",
    marginTop: 24,
    textAlign: "center",
    lineHeight: 16,
  },
})
