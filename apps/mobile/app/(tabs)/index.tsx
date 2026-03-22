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
import { theme } from "@/lib/theme";

function formatAccessedAt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

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

  const welcomeLine = `Welcome back, ${user?.name || `@${user?.username ?? "user"}`}`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageSubtitle}>{welcomeLine}</Text>

      <View style={styles.ctaRow}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/brainstorms")}
        >
          {renderLucide(FolderKanban, { size: 18, color: theme.primaryForeground })}
          <Text style={styles.btnPrimaryText}>Brainstorms</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/ideas")}
        >
          {renderLucide(Lightbulb, { size: 18, color: theme.secondaryForeground })}
          <Text style={styles.btnSecondaryText}>Ideas</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent activity</Text>
          <Text style={styles.cardDescription}>
            One feed of brainstorms and ideas you opened recently, newest first. Open a resource to
            add it here.
          </Text>
        </View>
        <View style={styles.cardBody}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.mutedForeground} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : items.length === 0 ? (
            <Text style={styles.empty}>
              Nothing yet. Visit a brainstorm or idea to build your feed.
            </Text>
          ) : (
            items.map((item, idx) => {
              const isBrainstorm = item.resource_type === "brainstorm";
              return (
                <Pressable
                  key={`${item.resource_type}-${item.owner_username}-${item.slug}`}
                  style={[styles.listRow, idx > 0 && styles.listRowBorder]}
                  onPress={() => openItem(item)}
                >
                  <View style={styles.listRowLeft}>
                    <Text style={styles.listTitle}>{item.title}</Text>
                    <Text style={styles.listSlug}>
                      @{item.owner_username}/{item.slug}
                    </Text>
                  </View>
                  <View style={styles.listRowRight}>
                    <View
                      style={[
                        styles.badge,
                        isBrainstorm ? styles.badgeBrainstorm : styles.badgeIdea,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isBrainstorm ? styles.badgeTextBrainstorm : styles.badgeTextIdea,
                        ]}
                      >
                        {isBrainstorm ? "Brainstorm" : "Idea"}
                      </Text>
                    </View>
                    <Text style={styles.time}>{formatAccessedAt(item.accessed_at)}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 32 },
  pageSubtitle: {
    fontSize: 14,
    color: theme.mutedForeground,
    marginBottom: 20,
  },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.primary,
    minHeight: 44,
  },
  btnPrimaryText: {
    color: theme.primaryForeground,
    fontSize: 15,
    fontWeight: "600",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.secondary,
    minHeight: 44,
  },
  btnSecondaryText: {
    color: theme.secondaryForeground,
    fontSize: 15,
    fontWeight: "600",
  },
  pressed: { opacity: 0.9 },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.cardForeground,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.mutedForeground,
    marginTop: 6,
    lineHeight: 20,
  },
  cardBody: { paddingHorizontal: 0 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 20,
  },
  loadingText: { fontSize: 14, color: theme.mutedForeground },
  empty: {
    fontSize: 14,
    color: theme.mutedForeground,
    padding: 20,
    paddingTop: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  listRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  listRowLeft: { flex: 1, minWidth: 0 },
  listTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.foreground,
  },
  listSlug: {
    fontSize: 12,
    color: theme.mutedForeground,
    marginTop: 4,
  },
  listRowRight: {
    alignItems: "flex-end",
    gap: 6,
    paddingTop: 2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeBrainstorm: { backgroundColor: theme.badgeBrainstormBg },
  badgeIdea: { backgroundColor: theme.badgeIdeaBg },
  badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  badgeTextBrainstorm: { color: theme.badgeBrainstormText },
  badgeTextIdea: { color: theme.badgeIdeaText },
  time: { fontSize: 12, color: theme.mutedForeground },
});
