"use client";

import { useCallback, useEffect, useState } from "react";
import { IdeaNotesEditor } from "@/components/idea-notes-editor";
import { ideaNotesApi, type IdeaNoteResponse } from "@/lib/api";

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
};

export function IdeaNotesTab({ username, slug, token, canEdit }: Props) {
  const [note, setNote] = useState<IdeaNoteResponse["note"] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadNote = useCallback(async () => {
    try {
      const res = await ideaNotesApi.get(token, username, slug);
      return res.note;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  useEffect(() => {
    let cancelled = false;
    loadNote().then((n) => {
      if (!cancelled) setNote(n);
    });
    return () => {
      cancelled = true;
    };
  }, [loadNote]);

  if (loading) {
    return (
      <div className="rounded-md border border-zinc-200 p-4">
        <p className="text-sm text-zinc-500">Loading notes…</p>
      </div>
    );
  }

  return (
    <IdeaNotesEditor
      username={username}
      slug={slug}
      token={token}
      canEdit={canEdit}
      initialNote={note}
      onLoad={loadNote}
    />
  );
}
