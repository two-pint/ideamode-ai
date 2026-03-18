"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Pin, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChatMessage,
  type ChatSessionResponse,
  chatSessionsApi,
  ApiError,
} from "@/lib/api";

const IDEABOT_TRIGGER = "@ideabot";

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
  onPinned?: () => void;
};

export function BrainstormChat({
  username,
  slug,
  token,
  canEdit,
  onPinned,
}: Props) {
  const [session, setSession] = useState<ChatSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await chatSessionsApi.getSession(token, username, slug);
      setSession(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setSession({ id: 0, brainstorm_id: 0, messages: [], pinned_message_id: null, pinned_message_content: null });
      }
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, streamingContent]);

  const handleSend = async () => {
    const text = content.trim();
    if (!text || sending) return;
    setContent("");
    setSending(true);
    setStreamingContent(null);

    try {
      const hasIdeabot = text.includes(IDEABOT_TRIGGER);
      const result = await chatSessionsApi.postMessage(
        token,
        username,
        slug,
        text,
        hasIdeabot ? (chunk) => setStreamingContent((prev) => (prev ?? "") + chunk) : undefined
      );
      if (result.session) setSession(result.session);
      else if (hasIdeabot) await loadSession();
    } catch (e) {
      console.error(e);
      setContent(text);
    } finally {
      setSending(false);
      setStreamingContent(null);
    }
  };

  const handlePin = async (messageId: string) => {
    try {
      await chatSessionsApi.pinMessage(token, username, slug, messageId);
      onPinned?.();
    } catch (e) {
      console.error(e);
    }
  };

  const messages = session?.messages ?? [];
  const showStreaming = streamingContent !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
        <p className="text-xs text-zinc-500">
          Include &quot;{IDEABOT_TRIGGER}&quot; in a message to get an AI reply. Messages without it are saved only.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <>
            <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-md border border-zinc-100 bg-zinc-50/50 p-3">
              {messages.length === 0 && !showStreaming && (
                <p className="text-sm text-zinc-500">No messages yet. Send one to start.</p>
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
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 size-6 p-0 text-zinc-500"
                        onClick={() => handlePin(msg.id)}
                        title="Pin to Overview"
                      >
                        <Pin className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {showStreaming && (
                <div className="flex gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200">
                    <Bot className="size-4 text-zinc-600" />
                  </div>
                  <div className="max-w-[85%] rounded-lg bg-white px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm">
                      {streamingContent}
                      <span className="animate-pulse">▌</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
            {canEdit ? (
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
                  placeholder={`Message… Use ${IDEABOT_TRIGGER} to get AI response`}
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
            ) : (
              <p className="text-sm text-zinc-500">You have read-only access.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
