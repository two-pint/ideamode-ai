"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Idea, ApiError, ideasApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

const TABS = ["Overview", "Brainstorm", "Analysis", "Wireframes", "PRD", "Notes", "Tasks"] as const;

export default function IdeaDetailPage() {
  const params = useParams<{ username: string; slug: string }>();
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [saving, setSaving] = useState(false);
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

            <div className="flex items-center gap-2">
              <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">{idea.status}</span>
              <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase">{idea.visibility}</span>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {canEditOverview ? (
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
                      { title: title.trim(), description: description.trim() }
                    );
                    setIdea(res.idea);
                    setTitle(res.idea.title);
                    setDescription(res.idea.description || "");
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
                Save changes
              </Button>
            ) : (
              <p className="text-sm text-zinc-500">You have read-only access to this idea.</p>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
