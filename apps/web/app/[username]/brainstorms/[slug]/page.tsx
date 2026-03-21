"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Share2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BrainstormChat } from "@/components/brainstorm-chat";
import { BrainstormNotesEditor } from "@/components/brainstorm-notes-editor";
import { BrainstormResearchTab } from "@/components/brainstorm-research-tab";
import { BrainstormResources } from "@/components/brainstorm-resources";
import { CreateIdeaFromBrainstormModal } from "@/components/create-idea-from-brainstorm-modal";
import { ResourceAccessList } from "@/components/resource-access-list";
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
  type BrainstormResource,
  type BrainstormStatus,
  type BrainstormVisibility,
  ApiError,
  brainstormsApi,
  brainstormResourcesApi,
  brainstormNotesApi,
  membersApi,
  type BrainstormNoteResponse,
  type Member,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { toastError, toastSuccess } from "@/lib/toast";

const TABS = ["Chat", "Research", "Notes"] as const;
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
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Chat");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [resources, setResources] = useState<BrainstormResource[]>([]);
  const [note, setNote] = useState<BrainstormNoteResponse["note"] | null>(null);
  const [createIdeaModalOpen, setCreateIdeaModalOpen] = useState(false);
  const [brainstormMembers, setBrainstormMembers] = useState<Member[]>([]);

  const loadResources = useCallback(async () => {
    if (!token || !params.username || !params.slug) return;
    try {
      const res = await brainstormResourcesApi.list(token, params.username, params.slug);
      setResources(res.resources);
    } catch {
      setResources([]);
    }
  }, [token, params.username, params.slug]);

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

  useEffect(() => {
    if (brainstorm && token) loadResources();
  }, [brainstorm?.id, token, loadResources]);

  const loadNote = useCallback(async () => {
    if (!token || !params.username || !params.slug) return null;
    try {
      const res = await brainstormNotesApi.get(token, params.username, params.slug);
      setNote(res.note);
      return res.note;
    } catch {
      setNote(null);
      return null;
    }
  }, [token, params.username, params.slug]);

  useEffect(() => {
    if (activeTab === "Notes" && token) loadNote();
  }, [activeTab, token, loadNote]);

  const canEditOverview = brainstorm?.can_edit ?? false;

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
      toastSuccess("Brainstorm updated");
    } catch (saveError) {
      const msg = saveError instanceof Error ? saveError.message : "Failed to save";
      setError(msg);
      toastError(msg);
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
      toastSuccess("Brainstorm deleted");
      router.replace("/dashboard");
    } catch (deleteError) {
      const msg = deleteError instanceof Error ? deleteError.message : "Failed to delete";
      setError(msg);
      toastError(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (!ready || !user || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!loading && error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  if (loading || !brainstorm) {
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
      {/* Overview card: always full width at top */}
      <Card className="mb-4 w-full">
          <CardHeader className="flex flex-row flex-wrap items-center gap-2">
            <CardTitle className="sr-only">Overview</CardTitle>
            {canEditOverview ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button disabled={saving} size="sm" onClick={handleSave}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save changes
                </Button>
                {user?.username === params.username && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await membersApi.list(
                          token!,
                          params.username,
                          params.slug,
                          "brainstorm"
                        );
                        setBrainstormMembers(res.members);
                        setCreateIdeaModalOpen(true);
                      } catch (e) {
                        console.error(e);
                        setCreateIdeaModalOpen(true);
                      }
                    }}
                  >
                    Create idea from brainstorm
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
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
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium">Title</p>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  readOnly={!canEditOverview}
                />
              </div>
              <div className="flex flex-wrap items-end gap-2 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  {canEditOverview ? (
                    <Select value={status} onValueChange={(v) => setStatus(v as BrainstormStatus)}>
                      <SelectTrigger className="w-[140px]">
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
                  ) : (
                    <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">
                      {brainstorm.status}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Visibility</p>
                  {canEditOverview ? (
                    <Select
                      value={visibility}
                      onValueChange={(v) => setVisibility(v as BrainstormVisibility)}
                    >
                      <SelectTrigger className="w-[140px]">
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
                  ) : (
                    <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">
                      {brainstorm.visibility}
                    </span>
                  )}
                </div>
              </div>
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

            {brainstorm.pinned_message_content && (
              <div className="rounded-md border border-zinc-200 bg-amber-50/50 p-3">
                <p className="text-xs font-medium uppercase text-zinc-500">Pinned insight</p>
                <p className="mt-1 text-sm text-zinc-900">{brainstorm.pinned_message_content}</p>
              </div>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
        </Card>

      {/* Main content: tabs (Chat, Research, Notes) + content, with Resources and People to the right */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
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
          {activeTab === "Chat" && (
            <BrainstormChat
              username={params.username}
              slug={params.slug}
              token={token!}
              canEdit={brainstorm.can_edit ?? false}
              onPinned={() => {
                brainstormsApi.getByOwnerAndSlug(token!, params.username, params.slug).then((r) => setBrainstorm(r.brainstorm));
              }}
            />
          )}
          {activeTab === "Research" && (
            <BrainstormResearchTab
              username={params.username}
              slug={params.slug}
              token={token!}
              canEdit={brainstorm.can_edit ?? false}
            />
          )}
          {activeTab === "Notes" && (
            <BrainstormNotesEditor
              username={params.username}
              slug={params.slug}
              token={token!}
              canEdit={brainstorm.can_edit ?? false}
              initialNote={note}
              onLoad={loadNote}
            />
          )}
        </div>

        <div className="space-y-4">
          <BrainstormResources
            username={params.username}
            slug={params.slug}
            token={token!}
            resources={resources}
            canEdit={brainstorm.can_edit ?? false}
            onUpdate={loadResources}
          />
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>People with access</CardTitle>
              {user.username === params.username && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShareDialogOpen(true)}
                  disabled={saving}
                >
                  <Share2 className="size-4" />
                  Share
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ResourceAccessList
                resourceType="brainstorm"
                ownerUsername={params.username}
                slug={params.slug}
                token={token}
                canManage={user?.username === params.username}
                refreshTrigger={shareDialogOpen}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {createIdeaModalOpen && (
        <CreateIdeaFromBrainstormModal
          open={createIdeaModalOpen}
          onOpenChange={setCreateIdeaModalOpen}
          brainstormTitle={title}
          brainstormDescription={description}
          username={params.username}
          slug={params.slug}
          token={token!}
          members={brainstormMembers}
        />
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
