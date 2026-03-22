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
import { ApiError, invitesApi, type PendingInviteItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export default function InvitationsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<PendingInviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await invitesApi.listMine(token);
    setInvites(res.invites);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    load()
      .catch(() => setInvites([]))
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

  async function accept(inv: PendingInviteItem) {
    if (!token) return;
    setActing(inv.token);
    try {
      await invitesApi.accept(token, inv.token);
      setInvites((list) => list.filter((i) => i.token !== inv.token));
      const r = inv.resource;
      if (inv.type === "brainstorm") {
        router.push(`/brainstorm/${r.owner_username}/${r.slug}`);
      } else {
        router.push(`/idea/${r.owner_username}/${r.slug}`);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        /* noop */
      }
    } finally {
      setActing(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={theme.primary} />
      ) : invites.length === 0 ? (
        <Text style={styles.empty}>No pending invitations.</Text>
      ) : (
        invites.map((inv) => (
          <View key={inv.token} style={styles.card}>
            <Text style={styles.type}>{inv.type}</Text>
            <Text style={styles.title}>{inv.resource.title}</Text>
            <Text style={styles.meta}>
              From @{inv.invited_by.username || "someone"} · {inv.role}
            </Text>
            <Pressable
              style={[styles.btn, acting === inv.token && styles.btnDisabled]}
              onPress={() => void accept(inv)}
              disabled={acting !== null}
            >
              <Text style={styles.btnText}>{acting === inv.token ? "…" : "Accept"}</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 32 },
  empty: { color: theme.mutedForeground, marginTop: 16 },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 12,
  },
  type: { fontSize: 11, color: theme.mutedForeground, textTransform: "uppercase" },
  title: { fontSize: 17, fontWeight: "600", color: theme.foreground, marginTop: 4 },
  meta: { fontSize: 13, color: theme.mutedForeground, marginTop: 6 },
  btn: {
    marginTop: 12,
    backgroundColor: theme.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: theme.primaryForeground, fontWeight: "600" },
});
