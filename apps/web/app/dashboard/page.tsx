"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AppShell } from "@/components/app-shell";
import { DraggableIdeaCard } from "@/components/draggable-idea-card";
import { DroppableLane } from "@/components/droppable-lane";
import { NewIdeaModal } from "@/components/new-idea-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Idea, type IdeaStatus, ideasApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

const LANE_STATUSES: readonly IdeaStatus[] = [
  "brainstorm",
  "validating",
  "validated",
  "shelved",
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [sharedIdeas, setSharedIdeas] = useState<Idea[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const groupedIdeas = useMemo(() => {
    const groups: Record<Idea["status"], Idea[]> = {
      brainstorm: [],
      validating: [],
      validated: [],
      shelved: [],
    };

    myIdeas.forEach((idea) => groups[idea.status].push(idea));
    return groups;
  }, [myIdeas]);

  const loadIdeas = useCallback(async () => {
    if (!token) return;
    setLoadingIdeas(true);
    try {
      const [mine, shared] = await Promise.all([
        ideasApi.listMine(token),
        ideasApi.listShared(token),
      ]);
      setMyIdeas(mine.ideas);
      setSharedIdeas(shared.ideas);
    } finally {
      setLoadingIdeas(false);
    }
  }, [token]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !user?.username || !token) return;

      const newStatus = over.id as IdeaStatus;
      if (!LANE_STATUSES.includes(newStatus)) return;

      const dragId = String(active.id);
      if (!dragId.startsWith("idea-")) return;
      const ideaId = Number(dragId.slice(5));
      if (Number.isNaN(ideaId)) return;

      const idea = myIdeas.find((i) => i.id === ideaId);
      if (!idea || idea.status === newStatus) return;

      setMyIdeas((current) =>
        current.map((i) => (i.id === ideaId ? { ...i, status: newStatus } : i))
      );
      try {
        const res = await ideasApi.updateByOwnerAndSlug(
          token,
          user.username,
          idea.slug,
          { status: newStatus }
        );
        setMyIdeas((current) =>
          current.map((i) => (i.id === ideaId ? res.idea : i))
        );
      } catch {
        setMyIdeas((current) =>
          current.map((i) => (i.id === ideaId ? { ...i, status: idea.status } : i))
        );
      }
    },
    [token, user?.username, myIdeas]
  );

  useEffect(() => {
    if (!ready) return;
    loadIdeas();
  }, [ready, loadIdeas]);

  if (!ready || !user || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <>
      <AppShell
        title="Dashboard"
        subtitle={`Welcome back, ${user.name || `@${user.username}`}`}
        active="dashboard"
      >
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            New Idea
          </Button>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">My Ideas</h2>
          {loadingIdeas ? (
            <p className="text-sm text-zinc-500">Loading your ideas...</p>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="grid gap-4 xl:grid-cols-4">
                {LANE_STATUSES.map((status) => (
                  <DroppableLane key={status} status={status} className="transition-[box-shadow]">
                    <Card className="h-fit">
                      <CardHeader>
                        <CardTitle className="capitalize">
                          {status} ({groupedIdeas[status].length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {groupedIdeas[status].length === 0 ? (
                          <p className="text-sm text-zinc-500">No ideas in this lane.</p>
                        ) : (
                          <div className="space-y-3">
                            {groupedIdeas[status].map((idea) => (
                              <DraggableIdeaCard
                                key={idea.id}
                                idea={idea}
                                ownerUsername={user.username}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </DroppableLane>
                ))}
              </div>
            </DndContext>
          )}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Shared With Me</h2>
          {loadingIdeas ? (
            <p className="text-sm text-zinc-500">Loading shared ideas...</p>
          ) : sharedIdeas.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No shared ideas yet. You will see collaborator and viewer ideas here.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sharedIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </section>
      </AppShell>

      <NewIdeaModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={async ({ title, description, slug }) => {
          const created = await ideasApi.create(token, { title, description, slug });
          setModalOpen(false);
          setMyIdeas((current) => [created.idea, ...current]);
          if (user.username) {
            router.push(`/${user.username}/${created.idea.slug}`);
          }
        }}
      />
    </>
  );
}
