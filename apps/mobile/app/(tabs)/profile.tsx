import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name || "—"}</Text>
      <Text style={styles.username}>@{user.username || "…"}</Text>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      <Text style={styles.email}>{user.email}</Text>

      <Pressable style={styles.secondary} onPress={() => router.push("/invitations")}>
        <Text style={styles.secondaryText}>Invitations</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => void handleLogout()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa", padding: 20 },
  name: { fontSize: 22, fontWeight: "700", color: "#18181b" },
  username: { fontSize: 15, color: "#71717a", marginTop: 4 },
  bio: { fontSize: 15, color: "#3f3f46", marginTop: 16, lineHeight: 22 },
  email: { fontSize: 14, color: "#71717a", marginTop: 12 },
  secondary: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryText: { fontSize: 16, fontWeight: "600", color: "#18181b" },
  button: {
    marginTop: 32,
    backgroundColor: "#18181b",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
