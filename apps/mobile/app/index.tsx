import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "";

export default function HomeScreen() {
  const [health, setHealth] = useState<{ status?: string } | null>(null);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL.replace(/\/$/, "")}/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IdeaMode Mobile</Text>
      <Text style={styles.subtitle}>Capture, develop, and validate ideas.</Text>
      {API_URL ? (
        <Text style={styles.api}>
          API: {API_URL}
          {health?.status ? ` · ${health.status}` : ""}
        </Text>
      ) : (
        <Text style={styles.hint}>
          Set EXPO_PUBLIC_API_URL in .env to connect to the API.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#18181b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#52525b",
    marginBottom: 24,
  },
  api: {
    fontSize: 14,
    color: "#71717a",
  },
  hint: {
    fontSize: 14,
    color: "#a1a1aa",
  },
});
