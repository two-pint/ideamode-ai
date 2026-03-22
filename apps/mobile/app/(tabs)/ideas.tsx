import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { ideasApi, type Idea } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AppTheme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

export default function IdeasTab() {
  const { token, user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [mine, setMine] = useState<Idea[]>([]);
  const [shared, setShared] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.username) return;
    const [m, s] = await Promise.all([ideasApi.listMine(token), ideasApi.listShared(token)]);
    setMine(m.ideas);
    setShared(s.ideas);
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

  function go(i: Idea) {
    const owner = i.owner?.username || user?.username;
    if (!owner) return;
    router.push(`/idea/${owner}/${i.slug}`);
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
            <Text style={styles.empty}>No ideas yet.</Text>
          ) : (
            mine.map((i) => (
              <Pressable key={i.id} style={styles.row} onPress={() => go(i)}>
                <Text style={styles.title}>{i.title}</Text>
                <Text style={styles.meta}>
                  {i.status} · {i.visibility}
                </Text>
              </Pressable>
            ))
          )}

          <Text style={[styles.section, { marginTop: 24 }]}>Shared with you</Text>
          {shared.length === 0 ? (
            <Text style={styles.empty}>Nothing shared yet.</Text>
          ) : (
            shared.map((i) => (
              <Pressable key={i.id} style={styles.row} onPress={() => go(i)}>
                <Text style={styles.title}>{i.title}</Text>
                <Text style={styles.meta}>
                  @{i.owner?.username} · {i.status}
                </Text>
              </Pressable>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 16, paddingBottom: 32 },
    section: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    empty: { color: theme.mutedForeground, marginTop: 8, fontSize: 14 },
    row: {
      backgroundColor: theme.card,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 10,
    },
    title: { fontSize: 16, fontWeight: "600", color: theme.foreground },
    meta: { fontSize: 13, color: theme.mutedForeground, marginTop: 4 },
  });
}
