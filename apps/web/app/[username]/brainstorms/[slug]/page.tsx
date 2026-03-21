"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Pencil, Share2, Trash2 } from "lucide-react";
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
import { useRecordRecentAccess } from "@/hooks/use-record-recent-access";
import { toastError, toastSuccess } from "@/lib/toast";

const TABS = ["Chat", "Research", "Notes", "Resources", "Sharing"] as const;
const STATUS_OPTIONS: BrainstormStatus[] = ["exploring", "researching", "ready", "archived"];
const VISIBILITY_OPTIONS: BrainstormVisibility[] = ["private", "shared"];

export default function BrainstormDetailPage() {
  const params = useParams<{ username: string; slug: string }>();
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [brainstorm, setBrainstorm] = useState<Brainstorm | null>(null);
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
  const [overviewEditing, setOverviewEditing] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const resetOverviewFormFromBrainstorm = useCallback((b: Brainstorm) => {
    setDescription(b.description || "");
    setSlug(b.slug);
    setStatus(b.status);
    setVisibility(b.visibility);
  }, []);

  useRecordRecentAccess(token, {
    resourceType: "brainstorm",
    ownerUsername: params.username,
    slug: params.slug,
    enabled: Boolean(brainstorm && !loading),
  });

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

  const cancelTitleEdit = useCallback(() => {
    setTitleEditing(false);
    setTitleDraft("");
  }, []);

  const handleSaveTitle = useCallback(async () => {
    if (!brainstorm || !token) return;
    const t = titleDraft.trim();
    if (!t) {
      toastError("Title is required");
      return;
    }
    if (t === brainstorm.title.trim()) {
      cancelTitleEdit();
      return;
    }
    setSavingTitle(true);
    try {
      const res = await brainstormsApi.updateByOwnerAndSlug(token, params.username, brainstorm.slug, {
        title: t,
      });
      setBrainstorm(res.brainstorm);
      cancelTitleEdit();
      toastSuccess("Title updated");
    } catch (saveTitleError) {
      const msg =
        saveTitleError instanceof Error ? saveTitleError.message : "Failed to update title";
      toastError(msg);
    } finally {
      setSavingTitle(false);
    }
  }, [brainstorm, token, params.username, titleDraft, cancelTitleEdit]);

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
          title: brainstorm.title.trim(),
          description: description.trim(),
          slug: slug.trim() || undefined,
          status,
          visibility,
        }
      );
      setBrainstorm(res.brainstorm);
      setDescription(res.brainstorm.description || "");
      setSlug(res.brainstorm.slug);
      setStatus(res.brainstorm.status);
      setVisibility(res.brainstorm.visibility);
      if (res.brainstorm.slug !== params.slug) {
        router.replace(`/${params.username}/brainstorms/${res.brainstorm.slug}`);
      }
      setOverviewEditing(false);
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

  const titleSlot =
    canEditOverview &&
    (titleEditing ? (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          className="h-9 max-w-md text-base font-semibold sm:max-w-xl"
          disabled={savingTitle}
          aria-label="Brainstorm title"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSaveTitle();
            }
            if (e.key === "Escape") {
              cancelTitleEdit();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={savingTitle || !titleDraft.trim()}
          onClick={() => void handleSaveTitle()}
        >
          {savingTitle ? <Loader2 className="size-4 animate-spin" /> : null}
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={savingTitle}
          onClick={cancelTitleEdit}
        >
          Cancel
        </Button>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-1">
        <h1 className="text-xl font-semibold">{brainstorm.title}</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          aria-label="Edit title"
          onClick={() => {
            setTitleDraft(brainstorm.title);
            setTitleEditing(true);
          }}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    ));

  const overviewHeaderSection =
    canEditOverview && overviewEditing ? (
      <Card className="w-full border-zinc-200 shadow-sm dark:border-zinc-700">
        <CardHeader className="flex flex-row flex-wrap items-center gap-2">
          <CardTitle className="sr-only">Overview</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={saving} size="sm" onClick={handleSave}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => {
                resetOverviewFormFromBrainstorm(brainstorm);
                setOverviewEditing(false);
                setError(null);
              }}
            >
              Cancel
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
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2 sm:gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
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
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Visibility</p>
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
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>

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

          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
      </Card>
    ) : (
      <div className="w-full space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            {!canEditOverview && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">You have read-only access.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase dark:bg-zinc-800">
                {brainstorm.status}
              </span>
              <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase dark:bg-zinc-800">
                {brainstorm.visibility}
              </span>
            </div>
          </div>
          {canEditOverview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setOverviewEditing(true)}
            >
              <Pencil className="mr-1.5 size-4" aria-hidden />
              Edit overview
            </Button>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
          {brainstorm.description?.trim() ? brainstorm.description : "No description yet."}
        </p>

      </div>
    );

  return (
    <AppShell
      title={brainstorm.title}
      titleSlot={titleSlot || undefined}
      subtitle={`@${params.username}/brainstorms/${brainstorm.slug}`}
      headerExtension={overviewHeaderSection}
      active={user.username === params.username ? "profile" : "idea"}
      fillHeight
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-wrap gap-2">
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

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {activeTab === "Chat" && (
            <BrainstormChat
              className="min-h-0 flex-1"
              username={params.username}
              slug={params.slug}
              token={token!}
              canEdit={brainstorm.can_edit ?? false}
              onPinned={() => {
                brainstormsApi
                  .getByOwnerAndSlug(token!, params.username, params.slug)
                  .then((r) => setBrainstorm(r.brainstorm));
              }}
            />
          )}
          {activeTab === "Research" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BrainstormResearchTab
                username={params.username}
                slug={params.slug}
                token={token!}
                canEdit={brainstorm.can_edit ?? false}
              />
            </div>
          )}
          {activeTab === "Notes" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BrainstormNotesEditor
                username={params.username}
                slug={params.slug}
                token={token!}
                canEdit={brainstorm.can_edit ?? false}
                initialNote={note}
                onLoad={loadNote}
              />
            </div>
          )}
          {activeTab === "Resources" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BrainstormResources
                username={params.username}
                slug={params.slug}
                token={token!}
                resources={resources}
                canEdit={brainstorm.can_edit ?? false}
                onUpdate={loadResources}
              />
            </div>
          )}
          {activeTab === "Sharing" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
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
          )}
        </div>
      </div>

      {createIdeaModalOpen && (
        <CreateIdeaFromBrainstormModal
          open={createIdeaModalOpen}
          onOpenChange={setCreateIdeaModalOpen}
          brainstormTitle={brainstorm.title}
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
