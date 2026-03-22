import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { brainstormsApi, type Brainstorm } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function BrainstormsTab() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [mine, setMine] = useState<Brainstorm[]>([]);
  const [shared, setShared] = useState<Brainstorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.username) return;
    const [m, s] = await Promise.all([
      brainstormsApi.listMine(token),
      brainstormsApi.listShared(token),
    ]);
    setMine(m.brainstorms);
    setShared(s.brainstorms);
  }, [token, user?.username]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    load()
      .catch(() => {
        setMine([]);
        setShared([]);
      })
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

  function go(b: Brainstorm) {
    const owner = b.owner?.username || user?.username;
    if (!owner) return;
    router.push(`/brainstorm/${owner}/${b.slug}`);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <>
          <Text style={styles.section}>Yours</Text>
          {mine.length === 0 ? (
            <Text style={styles.empty}>No brainstorms yet.</Text>
          ) : (
            mine.map((b) => (
              <Pressable key={b.id} style={styles.row} onPress={() => go(b)}>
                <Text style={styles.title}>{b.title}</Text>
                <Text style={styles.meta}>
                  {b.status} · {b.visibility}
                </Text>
              </Pressable>
            ))
          )}

          <Text style={[styles.section, { marginTop: 24 }]}>Shared with you</Text>
          {shared.length === 0 ? (
            <Text style={styles.empty}>Nothing shared yet.</Text>
          ) : (
            shared.map((b) => (
              <Pressable key={b.id} style={styles.row} onPress={() => go(b)}>
                <Text style={styles.title}>{b.title}</Text>
                <Text style={styles.meta}>
                  @{b.owner?.username} · {b.status}
                </Text>
              </Pressable>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { padding: 16, paddingBottom: 32 },
  section: { fontSize: 13, fontWeight: "600", color: "#71717a", textTransform: "uppercase" },
  empty: { color: "#71717a", marginTop: 8, fontSize: 14 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 14,
    marginTop: 10,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#18181b" },
  meta: { fontSize: 13, color: "#71717a", marginTop: 4 },
});
