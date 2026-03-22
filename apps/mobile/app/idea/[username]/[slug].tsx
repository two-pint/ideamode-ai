import Constants from "expo-constants";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ApiError,
  discussionSessionsApi,
  ideaAnalysesApi,
  ideaNotesApi,
  ideaPrdsApi,
  ideaTasksApi,
  ideaWireframesApi,
  ideasApi,
  membersApi,
  recentAccessApi,
  type Idea,
  type IdeaAnalysisItem,
  type IdeaTaskItem,
  type IdeaWireframeItem,
  type ChatMessage,
  type Member,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Tab =
  | "discussion"
  | "analysis"
  | "notes"
  | "tasks"
  | "prd"
  | "wireframes"
  | "sharing";

function webAppBase(): string {
  const extra = Constants.expoConfig?.extra as { webAppUrl?: string } | undefined;
  if (extra?.webAppUrl) return extra.webAppUrl.replace(/\/$/, "");
  return (process.env.EXPO_PUBLIC_WEB_APP_URL || "http://localhost:8080").replace(/\/$/, "");
}

export default function IdeaDetailScreen() {
  const { username, slug } = useLocalSearchParams<{ username: string; slug: string }>();
  const { token } = useAuth();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>("discussion");
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [discInput, setDiscInput] = useState("");
  const [sending, setSending] = useState(false);

  const [analyses, setAnalyses] = useState<IdeaAnalysisItem[]>([]);

  const [noteDraft, setNoteDraft] = useState("");

  const [tasks, setTasks] = useState<IdeaTaskItem[]>([]);
  const [taskTitle, setTaskTitle] = useState("");

  const [prds, setPrds] = useState<{ version: number; content: string }[]>([]);
  const [prdGen, setPrdGen] = useState("");

  const [wireframes, setWireframes] = useState<IdeaWireframeItem[]>([]);

  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (!token || !username || !slug) return;
    void recentAccessApi.record(token, {
      resource_type: "idea",
      owner_username: username,
      slug,
    }).catch(() => {});
  }, [token, username, slug]);

  useEffect(() => {
    if (!token || !username || !slug) return;
    setLoading(true);
    setError(null);
    ideasApi
      .getByOwnerAndSlug(token, username, slug)
      .then((res) => {
        setIdea(res.idea);
        navigation.setOptions({ title: res.idea.title });
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setError("Not found");
        else setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [token, username, slug, navigation]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "discussion") return;
    (async () => {
      try {
        let s = await discussionSessionsApi.getCurrent(token, username, slug);
        if (!s?.id) {
          s = await discussionSessionsApi.create(token, username, slug);
        }
        setSessionId(s.id);
        setMessages(s.messages || []);
      } catch {
        try {
          const s = await discussionSessionsApi.create(token, username, slug);
          setSessionId(s.id);
          setMessages(s.messages || []);
        } catch {
          setSessionId(null);
          setMessages([]);
        }
      }
    })();
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "analysis") return;
    ideaAnalysesApi.list(token, username, slug).then((r) => setAnalyses(r.analyses));
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "notes") return;
    ideaNotesApi.get(token, username, slug).then((n) => {
      setNoteDraft(JSON.stringify(n.note?.content ?? {}, null, 2));
    });
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "tasks") return;
    ideaTasksApi.list(token, username, slug).then((r) => setTasks(r.tasks));
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "prd") return;
    ideaPrdsApi.list(token, username, slug).then((r) =>
      setPrds(r.prds.map((p) => ({ version: p.version, content: p.content })))
    );
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "wireframes") return;
    ideaWireframesApi.list(token, username, slug).then((r) => setWireframes(r.wireframes));
  }, [token, username, slug, tab]);

  useEffect(() => {
    if (!token || !username || !slug || tab !== "sharing") return;
    membersApi.list(token, username, slug, "idea").then((m) => setMembers(m.members));
  }, [token, username, slug, tab]);

  async function sendDiscussion() {
    const text = discInput.trim();
    if (!token || !username || !slug || !sessionId || !text) return;
    setSending(true);
    try {
      setMessages((m) => [
        ...m,
        { id: `u-${Date.now()}`, role: "user", user_id: null, content: text },
      ]);
      setDiscInput("");
      await discussionSessionsApi.postMessage(token, username, slug, sessionId, text);
      const s = await discussionSessionsApi.get(token, username, slug, sessionId);
      setMessages(s.messages || []);
    } catch {
      const s = await discussionSessionsApi.get(token, username, slug, sessionId).catch(() => null);
      if (s) setMessages(s.messages || []);
    } finally {
      setSending(false);
    }
  }

  async function runAnalysis() {
    if (!token || !username || !slug) return;
    await ideaAnalysesApi.create(token, username, slug, "full");
    const r = await ideaAnalysesApi.list(token, username, slug);
    setAnalyses(r.analyses);
  }

  async function saveNote() {
    if (!token || !username || !slug) return;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(noteDraft || "{}") as Record<string, unknown>;
    } catch {
      parsed = { type: "doc", content: [] };
    }
    await ideaNotesApi.update(token, username, slug, parsed);
  }

  async function addTask() {
    if (!token || !username || !slug || !taskTitle.trim()) return;
    await ideaTasksApi.create(token, username, slug, { title: taskTitle.trim() });
    setTaskTitle("");
    const r = await ideaTasksApi.list(token, username, slug);
    setTasks(r.tasks);
  }

  async function toggleTask(t: IdeaTaskItem) {
    if (!token || !username || !slug) return;
    await ideaTasksApi.update(token, username, slug, t.id, { completed: !t.completed });
    const r = await ideaTasksApi.list(token, username, slug);
    setTasks(r.tasks);
  }

  async function generatePrd() {
    if (!token || !username || !slug) return;
    setPrdGen("");
    await ideaPrdsApi.generate(token, username, slug, (c) => setPrdGen((p) => p + c));
    const r = await ideaPrdsApi.list(token, username, slug);
    setPrds(r.prds.map((p) => ({ version: p.version, content: p.content })));
  }

  function openWireframeOnWeb() {
    const base = webAppBase();
    void Linking.openURL(`${base}/${encodeURIComponent(username)}/ideas/${encodeURIComponent(slug)}`);
  }

  async function invite() {
    if (!token || !username || !slug || !inviteEmail.trim()) return;
    await membersApi.create(token, username, slug, "idea", {
      email: inviteEmail.trim(),
      role: "collaborator",
    });
    setInviteEmail("");
    const m = await membersApi.list(token, username, slug, "idea");
    setMembers(m.members);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !idea) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error || "Not found"}</Text>
      </View>
    );
  }

  const canEdit = idea.can_edit !== false;

  const tabs: [Tab, string][] = [
    ["discussion", "Discussion"],
    ["analysis", "Analysis"],
    ["notes", "Notes"],
    ["tasks", "Tasks"],
    ["prd", "PRD"],
    ["wireframes", "Wireframes"],
    ["sharing", "Sharing"],
  ];

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map(([k, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === "discussion" && (
        <View style={styles.panel}>
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.msgList}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={styles.bubbleAuthor}>{item.role === "assistant" ? "Assistant" : "You"}</Text>
                <Text style={styles.bubbleText}>{item.content}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.hint}>No messages yet.</Text>}
          />
          {canEdit ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                value={discInput}
                onChangeText={setDiscInput}
                placeholder="Message…"
                multiline
              />
              <Pressable style={styles.sendBtn} onPress={() => void sendDiscussion()} disabled={sending}>
                <Text style={styles.sendTxt}>{sending ? "…" : "Send"}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.readonly}>Read-only</Text>
          )}
        </View>
      )}

      {tab === "analysis" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <Pressable style={styles.primaryBtn} onPress={() => void runAnalysis()}>
              <Text style={styles.primaryBtnText}>Run full analysis</Text>
            </Pressable>
          ) : null}
          {analyses.map((a) => (
            <View key={a.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {a.analysis_type} · {a.status}
              </Text>
              <Text style={styles.cardBody} numberOfLines={12}>
                {JSON.stringify(a.result, null, 2)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {tab === "notes" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <>
              <TextInput style={styles.noteArea} multiline value={noteDraft} onChangeText={setNoteDraft} />
              <Pressable style={styles.primaryBtn} onPress={() => void saveNote()}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.cardBody}>{noteDraft}</Text>
          )}
        </ScrollView>
      )}

      {tab === "tasks" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="New task"
              />
              <Pressable style={styles.sendBtn} onPress={() => void addTask()}>
                <Text style={styles.sendTxt}>Add</Text>
              </Pressable>
            </View>
          ) : null}
          {tasks.map((t) => (
            <Pressable key={t.id} style={styles.card} onPress={() => canEdit && void toggleTask(t)}>
              <Text style={[styles.cardTitle, t.completed && styles.done]}>
                {t.completed ? "✓ " : ""}
                {t.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {tab === "prd" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <Pressable style={styles.primaryBtn} onPress={() => void generatePrd()}>
              <Text style={styles.primaryBtnText}>Generate PRD</Text>
            </Pressable>
          ) : null}
          {prdGen ? (
            <View style={styles.card}>
              <Text style={styles.cardBody}>{prdGen}</Text>
            </View>
          ) : null}
          {prds.map((p) => (
            <View key={p.version} style={styles.card}>
              <Text style={styles.cardTitle}>v{p.version}</Text>
              <Text style={styles.cardBody} numberOfLines={40}>
                {p.content}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {tab === "wireframes" && (
        <ScrollView style={styles.panel}>
          <Text style={styles.wireHint}>
            Full Excalidraw editing is best on the web. Use the button below to open this idea in the browser.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={openWireframeOnWeb}>
            <Text style={styles.primaryBtnText}>Open in browser</Text>
          </Pressable>
          {wireframes.map((w) => (
            <View key={w.id} style={styles.card}>
              <Text style={styles.cardTitle}>{w.title}</Text>
              <Text style={styles.cardBody}>Updated {new Date(w.updated_at).toLocaleString()}</Text>
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
  root: { flex: 1, backgroundColor: "#fafafa" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: "#b91c1c" },
  tabs: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", backgroundColor: "#fff" },
  tab: { paddingHorizontal: 12, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#18181b" },
  tabText: { fontSize: 13, color: "#71717a" },
  tabTextActive: { color: "#18181b", fontWeight: "600" },
  panel: { flex: 1, padding: 12 },
  msgList: { paddingBottom: 12 },
  bubble: { marginBottom: 10, padding: 10, borderRadius: 10, maxWidth: "92%" },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#e4e4e7" },
  bubbleBot: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e4e4e7" },
  bubbleAuthor: { fontSize: 11, color: "#71717a", marginBottom: 4 },
  bubbleText: { fontSize: 15, color: "#18181b" },
  hint: { color: "#a1a1aa", textAlign: "center", marginTop: 24 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e4e4e7" },
  chatInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#18181b",
  },
  sendBtn: { backgroundColor: "#18181b", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  sendTxt: { color: "#fff", fontWeight: "600" },
  readonly: { color: "#71717a", textAlign: "center", marginTop: 12 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#18181b",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#18181b" },
  cardBody: { fontSize: 14, color: "#3f3f46", marginTop: 6 },
  noteArea: { minHeight: 200, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 8, padding: 10, backgroundColor: "#fff", fontSize: 12 },
  primaryBtn: {
    backgroundColor: "#18181b",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  done: { textDecorationLine: "line-through", color: "#71717a" },
  wireHint: { fontSize: 14, color: "#52525b", marginBottom: 12, lineHeight: 20 },
});
