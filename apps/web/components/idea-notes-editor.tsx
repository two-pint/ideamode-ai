"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ideaNotesApi, type IdeaNoteResponse } from "@/lib/api";

const DEBOUNCE_MS = 1500;

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
  initialNote: IdeaNoteResponse["note"] | null;
  onLoad: () => Promise<IdeaNoteResponse["note"] | null>;
};

export function IdeaNotesEditor({
  username,
  slug,
  token,
  canEdit,
  initialNote,
  onLoad,
}: Props) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialContentSet = useRef(false);

  // Reset when navigating to a different idea so the new note content is loaded
  useEffect(() => {
    initialContentSet.current = false;
  }, [username, slug]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-zinc-900 underline" } }),
      Placeholder.configure({ placeholder: "Take notes… Headings, bold, lists, links, code, blockquote." }),
    ],
    content: (initialNote?.content as Content) ?? undefined,
    editable: canEdit,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] w-full rounded-md border-0 bg-transparent px-0 py-2 text-sm outline-none prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  const save = useCallback(async () => {
    if (!editor || !canEdit) return;
    const json = editor.getJSON();
    setSaving(true);
    try {
      await ideaNotesApi.update(token, username, slug, json);
      setLastSaved(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [editor, canEdit, token, username, slug]);

  useEffect(() => {
    if (initialNote?.content && editor && !initialContentSet.current) {
      editor.commands.setContent(initialNote.content as Content);
      initialContentSet.current = true;
    }
  }, [initialNote, editor]);

  useEffect(() => {
    if (!editor || !canEdit) return;
    const onUpdate = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => save(), DEBOUNCE_MS);
    };
    editor.on("update", onUpdate);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      editor.off("update", onUpdate);
    };
  }, [editor, canEdit, save]);

  if (!editor) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-zinc-500">Loading editor…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {lastSaved && <span>Last saved at {lastSaved.toLocaleTimeString()}</span>}
          {saving && <span>Saving…</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {canEdit && (
          <div className="flex flex-wrap gap-1 rounded-md border border-zinc-200 bg-zinc-50/50 p-1">
            <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={() => editor.chain().focus().toggleCode().run()}>
              <Code className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="size-8 p-0"
              onClick={() => {
                const url = window.prompt("URL:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              <Link2 className="size-4" />
            </Button>
          </div>
        )}
        <EditorContent editor={editor} />
      </CardContent>
    </Card>
  );
}
