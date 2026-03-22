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
        <ActivityIndicator style={{ marginTop: 24 }} />
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
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { padding: 16, paddingBottom: 32 },
  empty: { color: "#71717a", marginTop: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
    marginBottom: 12,
  },
  type: { fontSize: 11, color: "#71717a", textTransform: "uppercase" },
  title: { fontSize: 17, fontWeight: "600", color: "#18181b", marginTop: 4 },
  meta: { fontSize: 13, color: "#52525b", marginTop: 6 },
  btn: {
    marginTop: 12,
    backgroundColor: "#18181b",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600" },
});
