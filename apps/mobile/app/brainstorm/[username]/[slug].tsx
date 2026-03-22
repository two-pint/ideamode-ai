import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
  type BrainstormStatus,
  type BrainstormVisibility,
  type ChatMessage,
  type Member,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AppTheme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

type Tab = "chat" | "research" | "notes" | "resources" | "sharing";

const BS_STATUSES: BrainstormStatus[] = ["exploring", "researching", "ready", "archived"];

function nextBsStatus(current: BrainstormStatus): BrainstormStatus {
  const i = BS_STATUSES.indexOf(current);
  return BS_STATUSES[(i + 1) % BS_STATUSES.length];
}

export default function BrainstormDetailScreen() {
  const { username, slug } = useLocalSearchParams<{ username: string; slug: string }>();
  const { token, user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tab, setTab] = useState<Tab>("chat");
  const [brainstorm, setBrainstorm] = useState<Brainstorm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaStatus, setMetaStatus] = useState<BrainstormStatus>("exploring");
  const [metaVisibility, setMetaVisibility] = useState<BrainstormVisibility>("private");
  const [metaSaving, setMetaSaving] = useState(false);

  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaDescription, setNewIdeaDescription] = useState("");
  const [creatingIdea, setCreatingIdea] = useState(false);

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

  const isOwner = Boolean(user?.username && username === user.username);

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
        const b = res.brainstorm;
        setBrainstorm(b);
        setMetaTitle(b.title);
        setMetaDescription(b.description ?? "");
        setMetaStatus(b.status);
        setMetaVisibility(b.visibility);
        navigation.setOptions({ title: b.title });
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

  async function saveMetadata() {
    if (!token || !username || !slug || !brainstorm) return;
    const t = metaTitle.trim();
    if (!t) return;
    setMetaSaving(true);
    try {
      const res = await brainstormsApi.updateByOwnerAndSlug(token, username, slug, {
        title: t,
        description: metaDescription.trim() || null,
        status: metaStatus,
        visibility: metaVisibility,
      });
      setBrainstorm(res.brainstorm);
      navigation.setOptions({ title: res.brainstorm.title });
      if (res.brainstorm.slug !== slug) {
        router.replace(`/brainstorm/${username}/${res.brainstorm.slug}`);
      }
    } finally {
      setMetaSaving(false);
    }
  }

  async function submitNewIdea() {
    const t = newIdeaTitle.trim();
    if (!token || !username || !slug || !t) return;
    setCreatingIdea(true);
    try {
      const res = await brainstormsApi.createIdeaFromBrainstorm(token, username, slug, {
        title: t,
        description: newIdeaDescription.trim() || undefined,
      });
      setIdeaModalOpen(false);
      setNewIdeaTitle("");
      setNewIdeaDescription("");
      router.push(`/idea/${username}/${res.idea.slug}`);
    } finally {
      setCreatingIdea(false);
    }
  }

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
      <Modal visible={ideaModalOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setIdeaModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New idea from brainstorm</Text>
            <TextInput
              style={styles.metaInput}
              value={newIdeaTitle}
              onChangeText={setNewIdeaTitle}
              placeholder="Title"
              placeholderTextColor={theme.subtleForeground}
            />
            <TextInput
              style={[styles.metaInput, styles.metaDesc]}
              value={newIdeaDescription}
              onChangeText={setNewIdeaDescription}
              placeholder="Description (optional)"
              placeholderTextColor={theme.subtleForeground}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setIdeaModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, creatingIdea && { opacity: 0.7 }]}
                onPress={() => void submitNewIdea()}
                disabled={creatingIdea || !newIdeaTitle.trim()}
              >
                <Text style={styles.primaryBtnText}>{creatingIdea ? "Creating…" : "Create"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView style={styles.topScroll} keyboardShouldPersistTaps="handled">
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
                onPress={() => setMetaStatus((s) => nextBsStatus(s))}
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
            {isOwner ? (
              <Pressable style={styles.secondaryCta} onPress={() => setIdeaModalOpen(true)}>
                <Text style={styles.secondaryCtaText}>Create idea from brainstorm</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.metaRead}>
            <Text style={styles.metaReadTitle}>{brainstorm.title}</Text>
            {brainstorm.description ? <Text style={styles.metaReadDesc}>{brainstorm.description}</Text> : null}
            <Text style={styles.metaReadMeta}>
              {brainstorm.status} · {brainstorm.visibility}
            </Text>
          </View>
        )}
      </ScrollView>

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
                placeholderTextColor={theme.subtleForeground}
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
                placeholderTextColor={theme.subtleForeground}
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
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={resUrl}
                onChangeText={setResUrl}
                placeholder="https://…"
                placeholderTextColor={theme.subtleForeground}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={resTitle}
                onChangeText={setResTitle}
                placeholder="Title"
                placeholderTextColor={theme.subtleForeground}
              />
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
    secondaryCta: {
      marginTop: 8,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    secondaryCtaText: { fontSize: 15, fontWeight: "600", color: theme.foreground },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      backgroundColor: theme.card,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: "600", color: theme.foreground, marginBottom: 16 },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
    modalCancel: { paddingVertical: 10, paddingHorizontal: 12 },
    modalCancelText: { fontSize: 15, color: theme.mutedForeground },
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
}
