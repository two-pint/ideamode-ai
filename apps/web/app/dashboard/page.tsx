"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { AppShell } from "@/components/app-shell";
import { BrainstormCard } from "@/components/brainstorm-card";
import { DraggableBrainstormCard } from "@/components/draggable-brainstorm-card";
import { DraggableIdeaCard } from "@/components/draggable-idea-card";
import { DroppableLane } from "@/components/droppable-lane";
import { IdeaCard } from "@/components/idea-card";
import { NewBrainstormModal } from "@/components/new-brainstorm-modal";
import { NewIdeaModal } from "@/components/new-idea-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type Brainstorm,
  type BrainstormStatus,
  type Idea,
  type IdeaStatus,
  brainstormsApi,
  ideasApi,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

const IDEA_LANE_STATUSES: readonly IdeaStatus[] = ["validating", "validated", "shelved"];
const BRAINSTORM_STATUSES: readonly BrainstormStatus[] = [
  "exploring",
  "researching",
  "ready",
  "archived",
];

type DashboardTab = "brainstorms" | "ideas";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("brainstorms");

  const [loadingBrainstorms, setLoadingBrainstorms] = useState(true);
  const [myBrainstorms, setMyBrainstorms] = useState<Brainstorm[]>([]);
  const [sharedBrainstorms, setSharedBrainstorms] = useState<Brainstorm[]>([]);
  const [isBrainstormModalOpen, setBrainstormModalOpen] = useState(false);

  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [sharedIdeas, setSharedIdeas] = useState<Idea[]>([]);
  const [isIdeaModalOpen, setIdeaModalOpen] = useState(false);

  // Track last drop target during drag; dnd-kit sometimes gives null `over` in onDragEnd
  const lastBrainstormOverIdRef = useRef<string | null>(null);
  const lastIdeaOverIdRef = useRef<string | null>(null);

  const allBrainstorms = useMemo(
    () => [...myBrainstorms, ...sharedBrainstorms],
    [myBrainstorms, sharedBrainstorms]
  );
  const allIdeas = useMemo(
    () => [...myIdeas, ...sharedIdeas],
    [myIdeas, sharedIdeas]
  );

  const groupedBrainstorms = useMemo(() => {
    const groups: Record<BrainstormStatus, Brainstorm[]> = {
      exploring: [],
      researching: [],
      ready: [],
      archived: [],
    };
    allBrainstorms.forEach((b) => groups[b.status].push(b));
    return groups;
  }, [allBrainstorms]);

  const groupedIdeas = useMemo(() => {
    const groups: Record<IdeaStatus, Idea[]> = {
      validating: [],
      validated: [],
      shelved: [],
    };
    allIdeas.forEach((idea) => groups[idea.status].push(idea));
    return groups;
  }, [allIdeas]);

  const loadBrainstorms = useCallback(async () => {
    if (!token) return;
    setLoadingBrainstorms(true);
    try {
      const [mine, shared] = await Promise.all([
        brainstormsApi.listMine(token),
        brainstormsApi.listShared(token),
      ]);
      setMyBrainstorms(mine.brainstorms);
      setSharedBrainstorms(shared.brainstorms);
    } finally {
      setLoadingBrainstorms(false);
    }
  }, [token]);

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

  const handleBrainstormDragStart = useCallback(() => {
    lastBrainstormOverIdRef.current = null;
  }, []);

  const handleBrainstormDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const id = String(over.id);
      if (BRAINSTORM_STATUSES.includes(id as BrainstormStatus)) {
        lastBrainstormOverIdRef.current = id;
      }
    } else {
      lastBrainstormOverIdRef.current = null;
    }
  }, []);

  const handleBrainstormDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const overId = (over?.id != null ? String(over.id) : lastBrainstormOverIdRef.current) as
        | BrainstormStatus
        | null
        | undefined;
      lastBrainstormOverIdRef.current = null;

      if (!overId || !user?.username || !token) return;

      const newStatus = overId as BrainstormStatus;
      if (!BRAINSTORM_STATUSES.includes(newStatus)) return;

      const dragId = String(active.id);
      if (!dragId.startsWith("brainstorm-")) return;
      const brainstormId = Number(dragId.slice(11)); // "brainstorm-" length is 11
      if (Number.isNaN(brainstormId)) return;

      const brainstorm = allBrainstorms.find((b) => b.id === brainstormId);
      if (!brainstorm || brainstorm.status === newStatus) return;
      const ownerUsername = brainstorm.owner?.username ?? user?.username;
      if (!ownerUsername) return;

      const isMine = brainstorm.owner?.username === user?.username;
      const setter = isMine ? setMyBrainstorms : setSharedBrainstorms;

      setter((current) =>
        current.map((b) =>
          b.id === brainstormId ? { ...b, status: newStatus } : b
        )
      );
      try {
        const res = await brainstormsApi.updateByOwnerAndSlug(
          token,
          ownerUsername,
          brainstorm.slug,
          { status: newStatus }
        );
        setter((current) =>
          current.map((b) =>
            b.id === brainstormId
              ? { ...b, status: res.brainstorm.status, updated_at: res.brainstorm.updated_at }
              : b
          )
        );
      } catch {
        setter((current) =>
          current.map((b) =>
            b.id === brainstormId ? { ...b, status: brainstorm.status } : b
          )
        );
      }
    },
    [token, user?.username, allBrainstorms, myBrainstorms, sharedBrainstorms]
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
        const res = await ideasApi.updateByOwnerAndSlug(
          token,
          ownerUsername,
          idea.slug,
          { status: newStatus }
        );
        setter((current) =>
          current.map((i) => (i.id === ideaId ? res.idea : i))
        );
      } catch {
        setter((current) =>
          current.map((i) =>
            i.id === ideaId ? { ...i, status: idea.status } : i
          )
        );
      }
    },
    [token, user?.username, allIdeas, myIdeas, sharedIdeas]
  );

  useEffect(() => {
    if (!ready) return;
    loadBrainstorms();
  }, [ready, loadBrainstorms]);

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
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-zinc-200">
          <button
            type="button"
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "brainstorms"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
            onClick={() => setActiveTab("brainstorms")}
          >
            Brainstorms
          </button>
          <button
            type="button"
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "ideas"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
            onClick={() => setActiveTab("ideas")}
          >
            Ideas
          </button>
        </div>

        {activeTab === "brainstorms" && (
          <>
            <div className="mb-6 flex justify-end">
              <Button onClick={() => setBrainstormModalOpen(true)}>
                <Plus className="size-4" />
                New Brainstorm
              </Button>
            </div>

            <section className="space-y-3">
              {loadingBrainstorms ? (
                <p className="text-sm text-zinc-500">Loading brainstorms...</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={pointerWithin}
                  onDragStart={handleBrainstormDragStart}
                  onDragOver={handleBrainstormDragOver}
                  onDragEnd={handleBrainstormDragEnd}
                >
                  <div className="grid gap-4 xl:grid-cols-4">
                    {BRAINSTORM_STATUSES.map((status) => (
                      <DroppableLane
                        key={status}
                        status={status}
                        className="transition-[box-shadow]"
                      >
                        <Card className="h-fit">
                          <CardHeader>
                            <CardTitle className="capitalize">
                              {status} ({groupedBrainstorms[status].length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {groupedBrainstorms[status].length === 0 ? (
                              <p className="text-sm text-zinc-500">
                                No brainstorms in this lane.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {groupedBrainstorms[status].map((brainstorm) => {
                                  const ownerUsername =
                                    brainstorm.owner?.username ?? user.username;
                                  const sharedByUsername =
                                    brainstorm.owner?.username &&
                                    brainstorm.owner.username !== user.username
                                      ? brainstorm.owner.username
                                      : null;
                                  return (
                                    <DraggableBrainstormCard
                                      key={brainstorm.id}
                                      brainstorm={brainstorm}
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
          </>
        )}

        {activeTab === "ideas" && (
          <>
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
                      <DroppableLane
                        key={status}
                        status={status}
                        className="transition-[box-shadow]"
                      >
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
                                  const ownerUsername =
                                    idea.owner?.username ?? user.username;
                                  const sharedByUsername =
                                    idea.owner?.username &&
                                    idea.owner.username !== user.username
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
          </>
        )}
      </AppShell>

      <NewBrainstormModal
        open={isBrainstormModalOpen}
        onClose={() => setBrainstormModalOpen(false)}
        onCreate={async ({ title, description, slug }) => {
          const created = await brainstormsApi.create(token, {
            title,
            description,
            slug,
          });
          setBrainstormModalOpen(false);
          setMyBrainstorms((current) => [created.brainstorm, ...current]);
          if (user.username) {
            router.push(`/${user.username}/brainstorms/${created.brainstorm.slug}`);
          }
        }}
      />

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
