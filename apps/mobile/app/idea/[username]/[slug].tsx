import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  ideasApi,
  membersApi,
  recentAccessApi,
  type Idea,
  type IdeaAnalysisItem,
  type IdeaStatus,
  type IdeaTaskItem,
  type IdeaVisibility,
  type ChatMessage,
  type Member,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AppTheme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

type Tab = "discussion" | "analysis" | "notes" | "tasks" | "prd" | "sharing";

const IDEA_STATUSES: IdeaStatus[] = ["validating", "validated", "shelved"];

function nextIdeaStatus(current: IdeaStatus): IdeaStatus {
  const i = IDEA_STATUSES.indexOf(current);
  return IDEA_STATUSES[(i + 1) % IDEA_STATUSES.length];
}

export default function IdeaDetailScreen() {
  const { username, slug } = useLocalSearchParams<{ username: string; slug: string }>();
  const { token } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tab, setTab] = useState<Tab>("discussion");
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaStatus, setMetaStatus] = useState<IdeaStatus>("validating");
  const [metaVisibility, setMetaVisibility] = useState<IdeaVisibility>("private");
  const [metaSaving, setMetaSaving] = useState(false);

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
        const i = res.idea;
        setIdea(i);
        setMetaTitle(i.title);
        setMetaDescription(i.description ?? "");
        setMetaStatus(i.status);
        setMetaVisibility(i.visibility);
        navigation.setOptions({ title: i.title });
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
    if (!token || !username || !slug || tab !== "sharing") return;
    membersApi.list(token, username, slug, "idea").then((m) => setMembers(m.members));
  }, [token, username, slug, tab]);

  async function saveMetadata() {
    if (!token || !username || !slug || !idea) return;
    const t = metaTitle.trim();
    if (!t) return;
    setMetaSaving(true);
    try {
      const res = await ideasApi.updateByOwnerAndSlug(token, username, slug, {
        title: t,
        description: metaDescription.trim() || null,
        status: metaStatus,
        visibility: metaVisibility,
      });
      setIdea(res.idea);
      navigation.setOptions({ title: res.idea.title });
      if (res.idea.slug !== slug) {
        router.replace(`/idea/${username}/${res.idea.slug}`);
      }
    } finally {
      setMetaSaving(false);
    }
  }

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
    ["sharing", "Sharing"],
  ];

  return (
    <View style={styles.root}>
      <ScrollView style={styles.topScroll} keyboardShouldPersistTaps="handled">
        {idea.pinned_message_content ? (
          <View style={styles.pinnedBox}>
            <Text style={styles.pinnedLabel}>Pinned</Text>
            <Text style={styles.pinnedText}>{idea.pinned_message_content}</Text>
          </View>
        ) : null}

        {canEdit ? (
          <View style={styles.metaSection}>
            <Text style={styles.metaHeading}>Details</Text>
            <TextInput
              style={styles.metaInput}
              value={metaTitle}
              onChangeText={setMetaTitle}
              placeholder="Title"
              placeholderTextColor={theme.subtleForeground}
            />
            <TextInput
              style={[styles.metaInput, styles.metaDesc]}
              value={metaDescription}
              onChangeText={setMetaDescription}
              placeholder="Short description"
              placeholderTextColor={theme.subtleForeground}
              multiline
            />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status</Text>
              <Pressable
                style={styles.metaChip}
                onPress={() => setMetaStatus((s) => nextIdeaStatus(s))}
              >
                <Text style={styles.metaChipText}>{metaStatus}</Text>
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Visibility</Text>
              <View style={styles.visRow}>
                {(["private", "shared"] as const).map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.visBtn, metaVisibility === v && styles.visBtnOn]}
                    onPress={() => setMetaVisibility(v)}
                  >
                    <Text style={[styles.visBtnText, metaVisibility === v && styles.visBtnTextOn]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable
              style={[styles.primaryBtn, metaSaving && { opacity: 0.7 }]}
              onPress={() => void saveMetadata()}
              disabled={metaSaving}
            >
              <Text style={styles.primaryBtnText}>{metaSaving ? "Saving…" : "Save details"}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.metaRead}>
            <Text style={styles.metaReadTitle}>{idea.title}</Text>
            {idea.description ? <Text style={styles.metaReadDesc}>{idea.description}</Text> : null}
            <Text style={styles.metaReadMeta}>
              {idea.status} · {idea.visibility}
            </Text>
          </View>
        )}
      </ScrollView>

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
                placeholderTextColor={theme.subtleForeground}
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
                placeholderTextColor={theme.subtleForeground}
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

      {tab === "sharing" && (
        <ScrollView style={styles.panel}>
          {canEdit ? (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="email@…"
                placeholderTextColor={theme.subtleForeground}
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

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    err: { color: theme.destructive },
    topScroll: { maxHeight: 280 },
    pinnedBox: {
      marginHorizontal: 12,
      marginTop: 10,
      padding: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.muted,
    },
    pinnedLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.mutedForeground,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    pinnedText: { fontSize: 14, color: theme.foreground, lineHeight: 20 },
    metaSection: { paddingHorizontal: 12, paddingBottom: 8 },
    metaHeading: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.mutedForeground,
      textTransform: "uppercase",
      marginBottom: 8,
      marginTop: 4,
    },
    metaInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radius.md,
      padding: 10,
      backgroundColor: theme.card,
      fontSize: 16,
      color: theme.foreground,
      marginBottom: 8,
    },
    metaDesc: { minHeight: 56, textAlignVertical: "top" },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      gap: 12,
    },
    metaLabel: { fontSize: 14, color: theme.mutedForeground },
    metaChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    metaChipText: { fontSize: 14, color: theme.foreground, fontWeight: "500" },
    visRow: { flexDirection: "row", gap: 8 },
    visBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    visBtnOn: { backgroundColor: theme.primary },
    visBtnText: { fontSize: 13, color: theme.mutedForeground, textTransform: "capitalize" },
    visBtnTextOn: { color: theme.primaryForeground, fontWeight: "600" },
    metaRead: { paddingHorizontal: 12, paddingVertical: 10 },
    metaReadTitle: { fontSize: 17, fontWeight: "600", color: theme.foreground },
    metaReadDesc: { fontSize: 14, color: theme.mutedForeground, marginTop: 6, lineHeight: 20 },
    metaReadMeta: { fontSize: 13, color: theme.subtleForeground, marginTop: 8 },
    tabs: {
      maxHeight: 48,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
    },
    tab: { paddingHorizontal: 12, paddingVertical: 12 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: theme.foreground },
    tabText: { fontSize: 13, color: theme.mutedForeground },
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
      fontSize: 12,
      color: theme.foreground,
    },
    primaryBtn: {
      backgroundColor: theme.primary,
      borderRadius: theme.radius.md,
      padding: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    primaryBtnText: { color: theme.primaryForeground, fontWeight: "600" },
    done: { textDecorationLine: "line-through", color: theme.mutedForeground },
  });
}
