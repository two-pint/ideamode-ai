import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ApiError,
  brainstormNotesApi,
  brainstormResearchApi,
  brainstormResourcesApi,
  brainstormsApi,
  chatSessionsApi,
  membersApi,
  recentAccessApi,
  type Brainstorm,
  type BrainstormResearchItem,
  type BrainstormResource,
  type ChatMessage,
  type Member,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

type Tab = "chat" | "research" | "notes" | "resources" | "sharing";

export default function BrainstormDetailScreen() {
  const { username, slug } = useLocalSearchParams<{ username: string; slug: string }>();
  const { token } = useAuth();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>("chat");
  const [brainstorm, setBrainstorm] = useState<Brainstorm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  const [research, setResearch] = useState<BrainstormResearchItem[]>([]);
  const [researchQuery, setResearchQuery] = useState("");

  const [noteJson, setNoteJson] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  const [resources, setResources] = useState<BrainstormResource[]>([]);
  const [resUrl, setResUrl] = useState("");
  const [resTitle, setResTitle] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (!token || !username || !slug) return;
    void recentAccessApi.record(token, {
      resource_type: "brainstorm",
      owner_username: username,
      slug,
    }).catch(() => {});
  }, [token, username, slug]);

  useEffect(() => {
    if (!token || !username || !slug) return;
    setLoading(true);
    setError(null);
    brainstormsApi
      .getByOwnerAndSlug(token, username, slug)
      .then((res) => {
        setBrainstorm(res.brainstorm);
        navigation.setOptions({ title: res.brainstorm.title });
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setError("Not found");
        else setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [token, username, slug, navigation]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "chat") return;
    chatSessionsApi.getSession(token, username, slug).then((s) => setMessages(s.messages || []));
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "research") return;
    brainstormResearchApi.list(token, username, slug).then((r) => setResearch(r.research));
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "notes") return;
    brainstormNotesApi.get(token, username, slug).then((n) => {
      const c = n.note?.content;
      setNoteJson(JSON.stringify(c ?? {}, null, 2));
      setNoteDraft(JSON.stringify(c ?? {}, null, 2));
    });
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "resources") return;
    brainstormResourcesApi.list(token, username, slug).then((r) => setResources(r.resources));
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "sharing") return;
    membersApi.list(token, username, slug, "brainstorm").then((m) => setMembers(m.members));
  }, [token, username, slug, tab]);

  async function sendChat() {
    const text = chatInput.trim();
    if (!token || !username || !slug || !text) return;
    setSending(true);
    try {
      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        user_id: null,
        content: text,
      };
      setMessages((m) => [...m, userMsg]);
      setChatInput("");
      let assistant = "";
      await chatSessionsApi.postMessage(token, username, slug, text, (chunk) => {
        assistant += chunk;
      });
      if (assistant) {
        setMessages((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: "assistant", user_id: null, content: assistant },
        ]);
      } else {
        const s = await chatSessionsApi.getSession(token, username, slug);
        setMessages(s.messages || []);
      }
    } catch {
      const s = await chatSessionsApi.getSession(token, username, slug).catch(() => null);
      if (s) setMessages(s.messages || []);
    } finally {
      setSending(false);
    }
  }

  async function addResearch() {
    if (!token || !username || !slug || !researchQuery.trim()) return;
    await brainstormResearchApi.create(token, username, slug, {
      research_type: "market",
      query: researchQuery.trim(),
    });
    setResearchQuery("");
    const r = await brainstormResearchApi.list(token, username, slug);
    setResearch(r.research);
  }

  async function saveNote() {
    if (!token || !username || !slug) return;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(noteDraft || "{}") as Record<string, unknown>;
    } catch {
      parsed = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: noteDraft }] }] };
    }
    await brainstormNotesApi.update(token, username, slug, parsed);
    setNoteJson(JSON.stringify(parsed, null, 2));
  }

  async function addResource() {
    if (!token || !username || !slug || !resUrl.trim()) return;
    await brainstormResourcesApi.create(token, username, slug, {
      url: resUrl.trim(),
      title: resTitle.trim() || undefined,
    });
    setResUrl("");
    setResTitle("");
    const r = await brainstormResourcesApi.list(token, username, slug);
    setResources(r.resources);
  }

  async function invite() {
    if (!token || !username || !slug || !inviteEmail.trim()) return;
    await membersApi.create(token, username, slug, "brainstorm", {
      email: inviteEmail.trim(),
      role: "collaborator",
    });
    setInviteEmail("");
    const m = await membersApi.list(token, username, slug, "brainstorm");
    setMembers(m.members);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !brainstorm) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error || "Not found"}</Text>
      </View>
    );
  }

  const canEdit = brainstorm.can_edit !== false;

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {(
          [
            ["chat", "Chat"],
            ["research", "Research"],
            ["notes", "Notes"],
            ["resources", "Resources"],
            ["sharing", "Sharing"],
          ] as const
        ).map(([k, label]) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            style={[styles.tab, tab === k && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === "chat" && (
        <View style={styles.panel}>
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.msgList}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={styles.bubbleAuthor}>{item.role === "assistant" ? "Ideabot" : "You"}</Text>
                <Text style={styles.bubbleText}>{item.content}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.hint}>No messages yet.</Text>}
          />
          {canEdit ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Message… (@ideabot for AI)"
                placeholderTextColor={theme.subtleForeground}
                multiline
              />
              <Pressable style={styles.sendBtn} onPress={() => void sendChat()} disabled={sending}>
                <Text style={styles.sendTxt}>{sending ? "…" : "Send"}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.readonly}>Read-only</Text>
          )}
        </View>
      )}

      {tab === "research" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={researchQuery}
                onChangeText={setResearchQuery}
                placeholder="Research query"
              />
              <Pressable style={styles.sendBtn} onPress={() => void addResearch()}>
                <Text style={styles.sendTxt}>Run</Text>
              </Pressable>
            </View>
          ) : null}
          {research.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardTitle}>{r.query}</Text>
              <Text style={styles.cardBody}>{r.result?.summary || JSON.stringify(r.result).slice(0, 400)}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {tab === "notes" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <>
              <TextInput
                style={styles.noteArea}
                multiline
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="TipTap JSON or plain text"
              />
              <Pressable style={styles.primaryBtn} onPress={() => void saveNote()}>
                <Text style={styles.primaryBtnText}>Save note</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.noteRead}>{noteJson}</Text>
          )}
        </ScrollView>
      )}

      {tab === "resources" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} value={resUrl} onChangeText={setResUrl} placeholder="https://…" />
              <TextInput style={[styles.input, { flex: 1 }]} value={resTitle} onChangeText={setResTitle} placeholder="Title" />
              <Pressable style={styles.sendBtn} onPress={() => void addResource()}>
                <Text style={styles.sendTxt}>Add</Text>
              </Pressable>
            </View>
          ) : null}
          {resources.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardTitle}>{r.title || r.url}</Text>
              <Text style={styles.cardBody}>{r.url}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {tab === "sharing" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="email@…"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Pressable style={styles.sendBtn} onPress={() => void invite()}>
                <Text style={styles.sendTxt}>Invite</Text>
              </Pressable>
            </View>
          ) : null}
          {members.map((m) => (
            <View key={m.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                @{m.username || "user"} · {m.role}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: theme.destructive },
  tabs: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.card,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.foreground },
  tabText: { fontSize: 14, color: theme.mutedForeground },
  tabTextActive: { color: theme.foreground, fontWeight: "600" },
  panel: { flex: 1, padding: 12 },
  msgList: { paddingBottom: 12 },
  bubble: { marginBottom: 10, padding: 10, borderRadius: theme.radius.md, maxWidth: "92%" },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: theme.border },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bubbleAuthor: { fontSize: 11, color: theme.mutedForeground, marginBottom: 4 },
  bubbleText: { fontSize: 15, color: theme.foreground },
  hint: { color: theme.subtleForeground, textAlign: "center", marginTop: 24 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: theme.card,
    fontSize: 15,
    color: theme.foreground,
  },
  sendBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  sendTxt: { color: theme.primaryForeground, fontWeight: "600" },
  readonly: { color: theme.mutedForeground, textAlign: "center", marginTop: 12 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: theme.card,
    fontSize: 15,
    color: theme.foreground,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: theme.foreground },
  cardBody: { fontSize: 14, color: theme.mutedForeground, marginTop: 6 },
  noteArea: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: theme.card,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: theme.foreground,
  },
  noteRead: { fontSize: 12, color: theme.mutedForeground },
  primaryBtn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radius.md,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryBtnText: { color: theme.primaryForeground, fontWeight: "600" },
});
