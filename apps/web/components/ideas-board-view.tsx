"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
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

const IDEA_LANE_STATUSES: readonly IdeaStatus[] = ["validating", "validated", "shelved"];

export function IdeasBoardView() {
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [sharedIdeas, setSharedIdeas] = useState<Idea[]>([]);
  const [isIdeaModalOpen, setIdeaModalOpen] = useState(false);
  const lastIdeaOverIdRef = useRef<string | null>(null);

  const allIdeas = useMemo(
    () => [...myIdeas, ...sharedIdeas],
    [myIdeas, sharedIdeas]
  );

  const groupedIdeas = useMemo(() => {
    const groups: Record<IdeaStatus, Idea[]> = {
      validating: [],
      validated: [],
      shelved: [],
    };
    allIdeas.forEach((idea) => groups[idea.status].push(idea));
    return groups;
  }, [allIdeas]);

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

  const handleIdeaDragStart = useCallback(() => {
    lastIdeaOverIdRef.current = null;
  }, []);

  const handleIdeaDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const id = String(over.id);
      if (IDEA_LANE_STATUSES.includes(id as IdeaStatus)) {
        lastIdeaOverIdRef.current = id;
      }
    } else {
      lastIdeaOverIdRef.current = null;
    }
  }, []);

  const handleIdeaDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const overId = (over?.id != null ? String(over.id) : lastIdeaOverIdRef.current) as
        | IdeaStatus
        | null
        | undefined;
      lastIdeaOverIdRef.current = null;

      if (!overId || !user?.username || !token) return;

      const newStatus = overId as IdeaStatus;
      if (!IDEA_LANE_STATUSES.includes(newStatus)) return;

      const dragId = String(active.id);
      if (!dragId.startsWith("idea-")) return;
      const ideaId = Number(dragId.slice(5));
      if (Number.isNaN(ideaId)) return;

      const idea = allIdeas.find((i) => i.id === ideaId);
      if (!idea || idea.status === newStatus) return;
      const ownerUsername = idea.owner?.username ?? user?.username;
      if (!ownerUsername) return;

      const isMine = idea.owner?.username === user?.username;
      const setter = isMine ? setMyIdeas : setSharedIdeas;

      setter((current) =>
        current.map((i) => (i.id === ideaId ? { ...i, status: newStatus } : i))
      );
      try {
        const res = await ideasApi.updateByOwnerAndSlug(token, ownerUsername, idea.slug, {
          status: newStatus,
        });
        setter((current) => current.map((i) => (i.id === ideaId ? res.idea : i)));
      } catch {
        setter((current) =>
          current.map((i) => (i.id === ideaId ? { ...i, status: idea.status } : i))
        );
      }
    },
    [token, user?.username, allIdeas]
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
        title="Ideas"
        subtitle="Drag cards between lanes to update validation status."
        active="ideas"
      >
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setIdeaModalOpen(true)}>
            <Plus className="size-4" />
            New Idea
          </Button>
        </div>

        <section className="space-y-3">
          {loadingIdeas ? (
            <p className="text-sm text-zinc-500">Loading ideas...</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleIdeaDragStart}
              onDragOver={handleIdeaDragOver}
              onDragEnd={handleIdeaDragEnd}
            >
              <div className="grid gap-4 xl:grid-cols-3">
                {IDEA_LANE_STATUSES.map((status) => (
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
                            {groupedIdeas[status].map((idea) => {
                              const ownerUsername = idea.owner?.username ?? user.username;
                              const sharedByUsername =
                                idea.owner?.username && idea.owner.username !== user.username
                                  ? idea.owner.username
                                  : null;
                              return (
                                <DraggableIdeaCard
                                  key={idea.id}
                                  idea={idea}
                                  ownerUsername={ownerUsername}
                                  sharedByUsername={sharedByUsername}
                                />
                              );
                            })}
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
      </AppShell>

      <NewIdeaModal
        open={isIdeaModalOpen}
        onClose={() => setIdeaModalOpen(false)}
        onCreate={async ({ title, description, slug }) => {
          const created = await ideasApi.create(token, { title, description, slug });
          setIdeaModalOpen(false);
          setMyIdeas((current) => [created.idea, ...current]);
          if (user.username) {
            router.push(`/${user.username}/ideas/${created.idea.slug}`);
          }
        }}
      />
    </>
  );
}
