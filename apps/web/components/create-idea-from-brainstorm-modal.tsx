"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brainstormsApi, type Member } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brainstormTitle: string;
  brainstormDescription: string;
  username: string;
  slug: string;
  token: string;
  members: Member[];
};

export function CreateIdeaFromBrainstormModal({
  open,
  onOpenChange,
  brainstormTitle,
  brainstormDescription,
  username,
  slug,
  token,
  members,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(brainstormTitle);
  const [description, setDescription] = useState(brainstormDescription);
  const [slugInput, setSlugInput] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(brainstormTitle);
      setDescription(brainstormDescription);
      setSlugInput("");
      setSelectedMemberIds([]);
      setError(null);
    }
  }, [open, brainstormTitle, brainstormDescription]);

  const slugPreview = useMemo(() => {
    if (slugInput.trim().length > 0) return slugInput.trim();
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }, [slugInput, title]);

  const toggleMember = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await brainstormsApi.createIdeaFromBrainstorm(token, username, slug, {
        title: title.trim(),
        description: description.trim() || undefined,
        slug: slugPreview || undefined,
        member_ids: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
      });
      onOpenChange(false);
      const ownerUsername = res.idea.owner?.username ?? username;
      router.push(`/${ownerUsername}/ideas/${res.idea.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create idea");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <Lightbulb className="size-5" />
          Create idea from brainstorm
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          Create a new idea linked to this brainstorm. You can edit title and slug.
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="create-idea-title">Title</Label>
            <Input
              id="create-idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="create-idea-description">Description</Label>
            <textarea
              id="create-idea-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="min-h-20 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="create-idea-slug">Slug</Label>
            <Input
              id="create-idea-slug"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="Auto-generated from title"
            />
            <p className="text-xs text-zinc-500">Preview: /{username}/ideas/{slugPreview || "slug"}</p>
          </div>

          {members.length > 0 && (
            <div className="space-y-1">
              <Label>Carry over members (optional)</Label>
              <ul className="space-y-1 rounded-md border border-zinc-100 bg-zinc-50/50 p-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`member-${m.id}`}
                      checked={selectedMemberIds.includes(m.user_id)}
                      onChange={() => toggleMember(m.user_id)}
                      className="rounded border-zinc-300"
                    />
                    <label htmlFor={`member-${m.id}`} className="text-sm">
                      {m.name || m.username || `User ${m.user_id}`}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create idea"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
