"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Pencil, PinOff, Share2, Trash2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { IdeaAnalysisTab } from "@/components/idea-analysis-tab"
import { IdeaDiscussionChat } from "@/components/idea-discussion-chat"
import { IdeaNotesTab } from "@/components/idea-notes-tab"
import { IdeaPrdTab } from "@/components/idea-prd-tab"
import { IdeaTasksTab } from "@/components/idea-tasks-tab"
import { IdeaWireframesTab } from "@/components/idea-wireframes-tab"
import { ResourceAccessList } from "@/components/resource-access-list"
import { ShareDialog } from "@/components/share-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type Idea,
  type IdeaStatus,
  type IdeaVisibility,
  ApiError,
  discussionSessionsApi,
  ideasApi,
} from "@/lib/api"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useRecordRecentAccess } from "@/hooks/use-record-recent-access"
import { toastError, toastSuccess } from "@/lib/toast"

const TABS = [
  "Overview",
  "Discussion",
  "Analysis",
  "Wireframes",
  "PRD",
  "Notes",
  "Tasks",
  "Sharing",
] as const
const STATUS_OPTIONS: IdeaStatus[] = ["validating", "validated", "shelved"]
const VISIBILITY_OPTIONS: IdeaVisibility[] = ["private", "shared"]

export default function IdeaDetailPage() {
  const params = useParams<{ username: string; slug: string }>()
  const router = useRouter()
  const { user, token, ready } = useRequireAuth()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [description, setDescription] = useState("")
  const [slug, setSlug] = useState("")
  const [status, setStatus] = useState<IdeaStatus>("validating")
  const [visibility, setVisibility] = useState<IdeaVisibility>("private")
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const [savingTitle, setSavingTitle] = useState(false)
  const [unpinning, setUnpinning] = useState(false)

  useRecordRecentAccess(token, {
    resourceType: "idea",
    ownerUsername: params.username,
    slug: params.slug,
    enabled: Boolean(idea && !loading),
  })

  useEffect(() => {
    if (!ready || !token) return

    setLoading(true)
    setError(null)
    ideasApi
      .getByOwnerAndSlug(token, params.username, params.slug)
      .then((res) => {
        setIdea(res.idea)
        setDescription(res.idea.description || "")
        setSlug(res.idea.slug)
        setStatus(res.idea.status)
        setVisibility(res.idea.visibility)
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 404) {
          router.replace("/not-found")
          return
        }
        setError("Failed to load idea.")
      })
      .finally(() => setLoading(false))
  }, [params.slug, params.username, ready, router, token])

  const canEditOverview = useMemo(
    () => idea?.can_edit === true && activeTab === "Overview",
    [activeTab, idea?.can_edit],
  )

  const canEditIdea = idea?.can_edit === true

  const cancelTitleEdit = useCallback(() => {
    setTitleEditing(false)
    setTitleDraft("")
  }, [])

  const handleSaveTitle = useCallback(async () => {
    if (!idea || !token) return
    const t = titleDraft.trim()
    if (!t) {
      toastError("Title is required")
      return
    }
    if (t === idea.title.trim()) {
      cancelTitleEdit()
      return
    }
    setSavingTitle(true)
    try {
      const res = await ideasApi.updateByOwnerAndSlug(
        token,
        params.username,
        idea.slug,
        { title: t },
      )
      setIdea(res.idea)
      cancelTitleEdit()
      toastSuccess("Title updated")
    } catch (saveTitleError) {
      const msg =
        saveTitleError instanceof Error
          ? saveTitleError.message
          : "Failed to update title"
      toastError(msg)
    } finally {
      setSavingTitle(false)
    }
  }, [idea, token, params.username, titleDraft, cancelTitleEdit])

  const refreshIdea = useCallback(async () => {
    if (!token || !params.username || !params.slug) return
    try {
      const res = await ideasApi.getByOwnerAndSlug(
        token,
        params.username,
        params.slug,
      )
      setIdea(res.idea)
    } catch {
      // ignore
    }
  }, [token, params.username, params.slug])

  const handleSave = async () => {
    if (!idea || !token) return
    setSaving(true)
    setError(null)
    try {
      const res = await ideasApi.updateByOwnerAndSlug(
        token,
        params.username,
        idea.slug,
        {
          title: idea.title.trim(),
          description: description.trim(),
          slug: slug.trim() || undefined,
          status,
          visibility,
        },
      )
      setIdea(res.idea)
      setDescription(res.idea.description || "")
      setSlug(res.idea.slug)
      setStatus(res.idea.status)
      setVisibility(res.idea.visibility)
      if (res.idea.slug !== params.slug) {
        router.replace(`/${params.username}/ideas/${res.idea.slug}`)
      }
      toastSuccess("Idea updated")
    } catch (saveError) {
      const msg =
        saveError instanceof Error ? saveError.message : "Failed to save"
      setError(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!idea || !token || !confirm("Delete this idea? This cannot be undone."))
      return
    setDeleting(true)
    setError(null)
    try {
      await ideasApi.deleteByOwnerAndSlug(token, params.username, idea.slug)
      toastSuccess("Idea deleted")
      router.replace("/dashboard")
    } catch (deleteError) {
      const msg =
        deleteError instanceof Error ? deleteError.message : "Failed to delete"
      setError(msg)
      toastError(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleUnpinPinned = useCallback(async () => {
    if (!idea || !token) return
    setUnpinning(true)
    try {
      await discussionSessionsApi.unpinPinned(token, params.username, idea.slug)
      setIdea((prev) =>
        prev
          ? { ...prev, pinned_message_id: null, pinned_message_content: null }
          : null,
      )
      toastSuccess("Pinned message removed")
    } catch (unpinError) {
      const msg =
        unpinError instanceof Error ? unpinError.message : "Failed to unpin"
      toastError(msg)
    } finally {
      setUnpinning(false)
    }
  }, [idea, token, params.username])

  if (!ready || !user || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    )
  }

  if (!loading && error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">{error}</p>
      </main>
    )
  }

  if (loading || !idea) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    )
  }

  const titleSlot =
    canEditIdea &&
    (titleEditing ? (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          className="h-9 max-w-md text-base font-semibold sm:max-w-xl"
          disabled={savingTitle}
          aria-label="Idea title"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void handleSaveTitle()
            }
            if (e.key === "Escape") {
              cancelTitleEdit()
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
        <h1 className="text-xl font-semibold">{idea.title}</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          aria-label="Edit title"
          onClick={() => {
            setTitleDraft(idea.title)
            setTitleEditing(true)
          }}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    ))

  return (
    <AppShell
      title={idea.title}
      titleSlot={titleSlot || undefined}
      subtitle={`@${params.username}/ideas/${idea.slug}`}
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
            {activeTab === "Discussion" ? (
              <IdeaDiscussionChat
                className="min-h-0 flex-1"
                username={params.username}
                slug={params.slug}
                token={token}
                canEdit={canEditIdea}
                onPinned={refreshIdea}
              />
            ) : activeTab === "Analysis" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <IdeaAnalysisTab
                  username={params.username}
                  slug={params.slug}
                  token={token}
                  canEdit={canEditIdea}
                />
              </div>
            ) : activeTab === "Notes" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <IdeaNotesTab
                  username={params.username}
                  slug={params.slug}
                  token={token}
                  canEdit={canEditIdea}
                />
              </div>
            ) : activeTab === "Tasks" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <IdeaTasksTab
                  username={params.username}
                  slug={params.slug}
                  token={token}
                  canEdit={canEditIdea}
                />
              </div>
            ) : activeTab === "Wireframes" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <IdeaWireframesTab
                  username={params.username}
                  slug={params.slug}
                  token={token}
                  canEdit={canEditIdea}
                />
              </div>
            ) : activeTab === "PRD" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <IdeaPrdTab
                  username={params.username}
                  slug={params.slug}
                  token={token}
                  canEdit={canEditIdea}
                />
              </div>
            ) : activeTab === "Sharing" ? (
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
                      resourceType="idea"
                      ownerUsername={params.username}
                      slug={params.slug}
                      token={token}
                      canManage={user?.username === params.username}
                      refreshTrigger={shareDialogOpen}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {idea.brainstorm_id != null &&
                  idea.brainstorm_slug &&
                  idea.owner?.username && (
                    <p className="text-sm text-zinc-600">
                      From brainstorm:{" "}
                      <Link
                        href={`/${idea.owner.username}/brainstorms/${idea.brainstorm_slug}`}
                        className="font-medium text-zinc-900 underline hover:no-underline"
                      >
                        {idea.brainstorm_title ?? "View linked brainstorm"}
                      </Link>
                    </p>
                  )}

                {idea.pinned_message_content && (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium uppercase text-zinc-500">
                        Pinned from Discussion
                      </p>
                      {canEditOverview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 shrink-0 gap-1 px-2 text-zinc-600 hover:text-zinc-900"
                          disabled={unpinning}
                          onClick={() => void handleUnpinPinned()}
                          title="Remove pinned message"
                        >
                          {unpinning ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <PinOff className="size-3.5" aria-hidden />
                          )}
                          Unpin
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">
                      {idea.pinned_message_content}
                    </p>
                  </div>
                )}

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
                      URL: /{params.username}/ideas/{slug || idea.slug}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {canEditOverview ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Status</p>
                        <Select
                          value={status}
                          onValueChange={(v) => setStatus(v as IdeaStatus)}
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
                          onValueChange={(v) =>
                            setVisibility(v as IdeaVisibility)
                          }
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
                        {idea.status}
                      </span>
                      <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">
                        {idea.visibility}
                      </span>
                    </>
                  )}
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                {canEditOverview ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled={saving} onClick={handleSave}>
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Save changes
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting || saving}
                      onClick={handleDelete}
                    >
                      {deleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      Delete idea
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    You have read-only access.
                  </p>
                )}
              </CardContent>
            </Card>
              </div>
            )}
        </div>
      </div>

      {user.username === params.username && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          resourceType="idea"
          resourceTitle={idea.title}
          ownerUsername={params.username}
          slug={params.slug}
          token={token}
        />
      )}
    </AppShell>
  )
}
