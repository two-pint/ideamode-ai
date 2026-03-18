"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Share2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ShareDialog } from "@/components/share-dialog";
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
import {
  type Brainstorm,
  type BrainstormStatus,
  type BrainstormVisibility,
  ApiError,
  brainstormsApi,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

const TABS = ["Overview", "Chat", "Research", "Notes"] as const;
const STATUS_OPTIONS: BrainstormStatus[] = ["exploring", "researching", "ready", "archived"];
const VISIBILITY_OPTIONS: BrainstormVisibility[] = ["private", "shared"];

export default function BrainstormDetailPage() {
  const params = useParams<{ username: string; slug: string }>();
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [brainstorm, setBrainstorm] = useState<Brainstorm | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<BrainstormStatus>("exploring");
  const [visibility, setVisibility] = useState<BrainstormVisibility>("private");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;

    setLoading(true);
    setError(null);
    brainstormsApi
      .getByOwnerAndSlug(token, params.username, params.slug)
      .then((res) => {
        setBrainstorm(res.brainstorm);
        setTitle(res.brainstorm.title);
        setDescription(res.brainstorm.description || "");
        setSlug(res.brainstorm.slug);
        setStatus(res.brainstorm.status);
        setVisibility(res.brainstorm.visibility);
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 404) {
          router.replace("/not-found");
          return;
        }
        setError("Failed to load brainstorm.");
      })
      .finally(() => setLoading(false));
  }, [params.slug, params.username, ready, router, token]);

  const canEditOverview = useMemo(
    () => user?.username === params.username && activeTab === "Overview",
    [activeTab, params.username, user?.username]
  );

  const handleSave = async () => {
    if (!brainstorm || !token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await brainstormsApi.updateByOwnerAndSlug(
        token,
        params.username,
        brainstorm.slug,
        {
          title: title.trim(),
          description: description.trim(),
          slug: slug.trim() || undefined,
          status,
          visibility,
        }
      );
      setBrainstorm(res.brainstorm);
      setTitle(res.brainstorm.title);
      setDescription(res.brainstorm.description || "");
      setSlug(res.brainstorm.slug);
      setStatus(res.brainstorm.status);
      setVisibility(res.brainstorm.visibility);
      if (res.brainstorm.slug !== params.slug) {
        router.replace(`/${params.username}/brainstorms/${res.brainstorm.slug}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!brainstorm || !token || !confirm("Delete this brainstorm? This cannot be undone."))
      return;
    setDeleting(true);
    setError(null);
    try {
      await brainstormsApi.deleteByOwnerAndSlug(token, params.username, brainstorm.slug);
      router.replace("/dashboard");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!ready || !user || !token || loading || !brainstorm) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <AppShell
      title={brainstorm.title}
      subtitle={`@${params.username}/brainstorms/${brainstorm.slug}`}
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
            <p className="text-sm text-zinc-500">{activeTab} content ships in a follow-up milestone.</p>
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
                onChange={(e) => setTitle(e.target.value)}
                readOnly={!canEditOverview}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                readOnly={!canEditOverview}
                className="min-h-32 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 read-only:bg-zinc-50"
              />
            </div>

            {canEditOverview && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Slug</p>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-friendly-slug"
                />
                <p className="text-xs text-zinc-500">
                  URL: /{params.username}/brainstorms/{slug || brainstorm.slug}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {canEditOverview ? (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <Select value={status} onValueChange={(v) => setStatus(v as BrainstormStatus)}>
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
                      onValueChange={(v) => setVisibility(v as BrainstormVisibility)}
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
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">
                    {brainstorm.status}
                  </span>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">
                    {brainstorm.visibility}
                  </span>
                </>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {canEditOverview ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button disabled={saving} onClick={handleSave}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save changes
                </Button>
                {user.username === params.username && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShareDialogOpen(true)}
                    disabled={saving}
                  >
                    <Share2 className="size-4" />
                    Share
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={deleting || saving}
                  onClick={handleDelete}
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Delete brainstorm
                </Button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">You have read-only access.</p>
            )}
          </CardContent>
        </Card>
      )}

      {user.username === params.username && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          resourceType="brainstorm"
          resourceTitle={brainstorm.title}
          ownerUsername={params.username}
          slug={params.slug}
          token={token}
        />
      )}
    </AppShell>
  );
}
