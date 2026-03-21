"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Pin, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChatMessage,
  type DiscussionSessionResponse,
  discussionSessionsApi,
  ApiError,
} from "@/lib/api";

const STARTER_PROMPTS = [
  "What assumptions am I making that could be wrong?",
  "Who is the target customer and what problem are we solving?",
  "What would need to be true for this idea to succeed?",
];

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
  onPinned?: () => void;
};

export function IdeaDiscussionChat({
  username,
  slug,
  token,
  canEdit,
  onPinned,
}: Props) {
  const [sessions, setSessions] = useState<DiscussionSessionResponse[]>([]);
  const [currentSession, setCurrentSession] = useState<DiscussionSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await discussionSessionsApi.list(token, username, slug);
      setSessions(res.sessions);
      const active = res.sessions.find((s) => !s.archived_at);
      if (active) {
        setCurrentSession(active);
      } else {
        setCurrentSession(null);
      }
    } catch {
      setSessions([]);
      setCurrentSession(null);
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  const ensureSession = useCallback(async () => {
    if (currentSession) return currentSession;
    if (!canEdit) return null;
    setCreatingSession(true);
    try {
      const session = await discussionSessionsApi.create(token, username, slug);
      setSessions((prev) => [session, ...prev]);
      setCurrentSession(session);
      return session;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setCreatingSession(false);
    }
  }, [canEdit, currentSession, token, username, slug]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, streamingContent]);

  const handleSend = async () => {
    const text = content.trim();
    if (!text || sending || !canEdit) return;

    const session = await ensureSession();
    if (!session) return;

    setContent("");
    setSending(true);
    setStreamingContent(null);

    try {
      await discussionSessionsApi.postMessage(
        token,
        username,
        slug,
        session.id,
        text,
        (chunk) => setStreamingContent((prev) => (prev ?? "") + chunk)
      );
      const updated = await discussionSessionsApi.get(token, username, slug, session.id);
      setCurrentSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === session.id ? updated : s)));
    } catch (e) {
      console.error(e);
      setContent(text);
    } finally {
      setSending(false);
      setStreamingContent(null);
    }
  };

  const handlePin = async (messageId: string) => {
    if (!currentSession) return;
    try {
      await discussionSessionsApi.pinMessage(token, username, slug, currentSession.id, messageId);
      onPinned?.();
      await loadSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartNewSession = async () => {
    if (!canEdit || creatingSession) return;
    setCreatingSession(true);
    try {
      const session = await discussionSessionsApi.create(token, username, slug);
      setSessions((prev) => [session, ...prev]);
      setCurrentSession(session);
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingSession(false);
    }
  };

  const messages = currentSession?.messages ?? [];
  const showStreaming = streamingContent !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion</CardTitle>
        <p className="text-xs text-zinc-500">
          A critical thinking partner: challenges assumptions and helps articulate the problem and customer.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : !currentSession && !canEdit ? (
          <p className="text-sm text-zinc-500">No discussion session. Only owners and collaborators can start one.</p>
        ) : !currentSession ? (
          <div className="space-y-3 rounded-md border border-zinc-100 bg-zinc-50/50 p-4">
            <p className="text-sm text-zinc-700">Start a discussion to pressure-test your idea with AI.</p>
            <Button onClick={handleStartNewSession} disabled={creatingSession}>
              {creatingSession ? "Starting…" : "Start discussion"}
            </Button>
            <p className="text-xs text-zinc-500">Suggested questions:</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600">
              {STARTER_PROMPTS.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            {sessions.length > 1 && (
              <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-2">
                <span className="text-xs text-zinc-500">Sessions:</span>
                {sessions.map((s) => (
                  <Button
                    key={s.id}
                    variant={currentSession?.id === s.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentSession(s)}
                    disabled={!!s.archived_at && currentSession?.id !== s.id}
                  >
                    {s.archived_at ? `Archived ${new Date(s.created_at).toLocaleDateString()}` : "Current"}
                  </Button>
                ))}
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleStartNewSession} disabled={creatingSession}>
                    New session
                  </Button>
                )}
              </div>
            )}
            <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-md border border-zinc-100 bg-zinc-50/50 p-3">
              {messages.length === 0 && !showStreaming && (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-500">No messages yet. Try:</p>
                  <ul className="space-y-1">
                    {STARTER_PROMPTS.map((q, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          className="text-left text-sm text-zinc-700 underline hover:no-underline"
                          onClick={() => setContent(q)}
                        >
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200">
                    {msg.role === "assistant" ? (
                      <Bot className="size-4 text-zinc-600" />
                    ) : (
                      <User className="size-4 text-zinc-600" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      msg.role === "assistant"
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-900 text-white"
                    }`}
                  >
                    {(msg.author_name || canEdit) && (
                      <div className="mb-1 flex items-center gap-2">
                        {msg.author_name ? (
                          <p
                            className={`min-w-0 flex-1 truncate text-xs font-medium ${
                              msg.role === "assistant" ? "text-zinc-500" : "text-zinc-300"
                            }`}
                          >
                            {msg.author_name}
                          </p>
                        ) : (
                          <span className="min-w-0 flex-1" aria-hidden />
                        )}
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`size-6 shrink-0 p-0 ${
                              msg.role === "assistant"
                                ? "text-zinc-500 hover:text-zinc-900"
                                : "text-zinc-400 hover:text-white"
                            }`}
                            onClick={() => handlePin(msg.id)}
                            title="Pin to Overview"
                          >
                            <Pin className="size-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {showStreaming && (
                <div className="flex gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200">
                    <Bot className="size-4 text-zinc-600" />
                  </div>
                  <div className="max-w-[85%] rounded-lg bg-white px-3 py-2 text-zinc-900">
                    <p className="mb-1 text-xs font-medium text-zinc-500">Ideabot</p>
                    <p className="whitespace-pre-wrap text-sm">
                      {streamingContent}
                      <span className="animate-pulse">▌</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
            {canEdit && (
              <div className="flex gap-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a hard question…"
                  className="min-h-[80px] flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  disabled={sending}
                  rows={2}
                />
                <Button
                  size="sm"
                  disabled={sending || !content.trim()}
                  onClick={handleSend}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            )}
            {!canEdit && (
              <p className="text-sm text-zinc-500">You have read-only access.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
