"use client";

import { useState } from "react";
import { Link2, Pencil, Trash2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type BrainstormResource,
  brainstormResourcesApi,
  ApiError,
} from "@/lib/api";

type Props = {
  username: string;
  slug: string;
  token: string;
  resources: BrainstormResource[];
  canEdit: boolean;
  onUpdate: () => void;
};

export function BrainstormResources({
  username,
  slug,
  token,
  resources,
  canEdit,
  onUpdate,
}: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const handleAdd = async () => {
    const u = url.trim();
    if (!u) return;
    setSaving(true);
    try {
      await brainstormResourcesApi.create(token, username, slug, {
        url: u,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setUrl("");
      setTitle("");
      setNotes("");
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r: BrainstormResource) => {
    setEditingId(r.id);
    setEditUrl(r.url);
    setEditTitle(r.title || "");
    setEditNotes(r.notes || "");
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    setSaving(true);
    try {
      await brainstormResourcesApi.update(token, username, slug, editingId, {
        url: editUrl.trim(),
        title: editTitle.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setEditingId(null);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this resource?")) return;
    try {
      await brainstormResourcesApi.delete(token, username, slug, id);
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEdit && (
          <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50/50 p-3">
            <Input
              placeholder="URL (e.g. https://... or YouTube link)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              size="sm"
              disabled={saving || !url.trim()}
              onClick={handleAdd}
            >
              Add resource
            </Button>
          </div>
        )}

        <ul className="space-y-2">
          {resources.length === 0 && (
            <li className="text-sm text-zinc-500">No resources yet.</li>
          )}
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-1 rounded-md border border-zinc-100 p-2"
            >
              {editingId === r.id ? (
                <>
                  <Input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="URL"
                  />
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <Input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notes"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={saving} onClick={saveEdit}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {r.resource_type === "youtube" ? (
                      <Youtube className="size-4 text-red-600" />
                    ) : (
                      <Link2 className="size-4 text-zinc-500" />
                    )}
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-zinc-900 underline"
                    >
                      {r.title || r.url}
                    </a>
                    {canEdit && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0"
                          onClick={() => startEdit(r)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 text-red-600"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  {r.notes && (
                    <p className="text-xs text-zinc-500">{r.notes}</p>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
