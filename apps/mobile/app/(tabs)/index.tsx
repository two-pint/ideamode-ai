import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FolderKanban, Lightbulb } from "lucide-react-native";
import { recentAccessApi, type RecentAccessItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { renderLucide } from "@/lib/render-lucide";

export default function HomeTab() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RecentAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await recentAccessApi.list(token);
    setItems(res.items);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    load()
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token, load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  function openItem(item: RecentAccessItem) {
    if (item.resource_type === "brainstorm") {
      router.push(`/brainstorm/${item.owner_username}/${item.slug}`);
    } else {
      router.push(`/idea/${item.owner_username}/${item.slug}`);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.welcome}>Welcome back{user?.name ? `, ${user.name}` : ""}</Text>

      <View style={styles.row}>
        <Pressable style={styles.card} onPress={() => router.push("/(tabs)/brainstorms")}>
          {renderLucide(FolderKanban, { size: 24, color: "#18181b" })}
          <Text style={styles.cardTitle}>Brainstorms</Text>
        </Pressable>
        <Pressable style={styles.card} onPress={() => router.push("/(tabs)/ideas")}>
          {renderLucide(Lightbulb, { size: 24, color: "#18181b" })}
          <Text style={styles.cardTitle}>Ideas</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Recent</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No recent activity yet. Open a brainstorm or idea to see it here.</Text>
      ) : (
        items.map((item) => (
          <Pressable key={`${item.resource_type}-${item.owner_username}-${item.slug}`} style={styles.item} onPress={() => openItem(item)}>
            <Text style={styles.itemType}>{item.resource_type}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              @{item.owner_username} · {new Date(item.accessed_at).toLocaleString()}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { padding: 16, paddingBottom: 32 },
  welcome: { fontSize: 20, fontWeight: "600", color: "#18181b", marginBottom: 20 },
  row: { flexDirection: "row", gap: 12, marginBottom: 28 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#18181b" },
  section: { fontSize: 13, fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 },
  empty: { color: "#71717a", marginTop: 8, fontSize: 14 },
  item: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 12,
    marginTop: 10,
  },
  itemType: { fontSize: 11, color: "#71717a", textTransform: "capitalize" },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#18181b", marginTop: 4 },
  itemMeta: { fontSize: 12, color: "#a1a1aa", marginTop: 4 },
});
