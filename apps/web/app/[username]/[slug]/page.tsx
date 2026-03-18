"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Idea, type IdeaStatus, type IdeaVisibility, ApiError, ideasApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

const TABS = ["Overview", "Brainstorm", "Analysis", "Wireframes", "PRD", "Notes", "Tasks"] as const;
const STATUS_OPTIONS: IdeaStatus[] = ["brainstorm", "validating", "validated", "shelved"];
const VISIBILITY_OPTIONS: IdeaVisibility[] = ["private", "shared"];

export default function IdeaDetailPage() {
  const params = useParams<{ username: string; slug: string }>();
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("brainstorm");
  const [visibility, setVisibility] = useState<IdeaVisibility>("private");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;

    setLoading(true);
    ideasApi
      .getByOwnerAndSlug(token, params.username, params.slug)
      .then((res) => {
        setIdea(res.idea);
        setTitle(res.idea.title);
        setDescription(res.idea.description || "");
        setSlug(res.idea.slug);
        setStatus(res.idea.status);
        setVisibility(res.idea.visibility);
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 404) {
          router.replace("/not-found");
          return;
        }
        setError("Failed to load idea.");
      })
      .finally(() => setLoading(false));
  }, [params.slug, params.username, ready, router, token]);

  const canEditOverview = useMemo(
    () => user?.username === params.username && activeTab === "Overview",
    [activeTab, params.username, user?.username]
  );

  if (!ready || !user || !token || loading || !idea) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <AppShell
      title={idea.title}
      subtitle={`@${params.username}/${idea.slug}`}
      active={user.username === params.username ? "profile" : "idea"}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={tab === activeTab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab !== "Overview" ? (
        <Card>
          <CardHeader>
            <CardTitle>{activeTab}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">{activeTab} content ships in a follow-up ticket.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Title</p>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                readOnly={!canEditOverview}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                readOnly={!canEditOverview}
                className="min-h-32 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 read-only:bg-zinc-50"
              />
            </div>

            {canEditOverview ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">Slug</p>
                <Input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="url-friendly-slug"
                />
                <p className="text-xs text-zinc-500">URL: /{params.username}/{slug || idea.slug}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {canEditOverview ? (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as IdeaStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Visibility</p>
                    <Select
                      value={visibility}
                      onValueChange={(value) => setVisibility(value as IdeaVisibility)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">{idea.status}</span>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">{idea.visibility}</span>
                </>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {canEditOverview ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setError(null);
                    try {
                      const res = await ideasApi.updateByOwnerAndSlug(
                        token,
                        params.username,
                        idea.slug,
                        {
                          title: title.trim(),
                          description: description.trim(),
                          slug: slug.trim() || undefined,
                          status,
                          visibility,
                        }
                      );
                      setIdea(res.idea);
                      setTitle(res.idea.title);
                      setDescription(res.idea.description || "");
                      setSlug(res.idea.slug);
                      setStatus(res.idea.status);
                      setVisibility(res.idea.visibility);
                      if (res.idea.slug !== params.slug) {
                        router.replace(`/${params.username}/${res.idea.slug}`);
                      }
                    } catch (saveError) {
                      setError(saveError instanceof Error ? saveError.message : "Failed to save");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={deleting || saving}
                  onClick={async () => {
                    if (!confirm("Delete this idea? This cannot be undone.")) return;
                    setDeleting(true);
                    setError(null);
                    try {
                      await ideasApi.deleteByOwnerAndSlug(token, params.username, idea.slug);
                      router.replace("/dashboard");
                    } catch (deleteError) {
                      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Delete idea
                </Button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">You have read-only access to this idea.</p>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
