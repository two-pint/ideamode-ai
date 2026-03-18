"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NewIdeaModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; description: string; slug: string }) => Promise<void>;
};

export function NewIdeaModal({ open, onClose, onCreate }: NewIdeaModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slugPreview = useMemo(() => {
    if (slug.trim().length > 0) return slug;
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }, [slug, title]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 dark:bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">New idea</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Create an idea and jump straight into it.</p>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setSaving(true);
            try {
              await onCreate({ title: title.trim(), description: description.trim(), slug: slugPreview });
              setTitle("");
              setDescription("");
              setSlug("");
            } catch (createError) {
              setError(createError instanceof Error ? createError.message : "Failed to create idea");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="idea-title">Title</Label>
            <Input
              id="idea-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="My next big idea"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="idea-slug">Slug</Label>
            <Input
              id="idea-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="auto-generated from title"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Preview: /{slugPreview || "your-idea-slug"}</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="idea-description">Description</Label>
            <textarea
              id="idea-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What problem are you solving?"
              className="min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-400/20"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || title.trim().length < 3}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create idea
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
