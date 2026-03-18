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

  const groupedBrainstorms = useMemo(() => {
    const groups: Record<BrainstormStatus, Brainstorm[]> = {
      exploring: [],
      researching: [],
      ready: [],
      archived: [],
    };
    myBrainstorms.forEach((b) => groups[b.status].push(b));
    return groups;
  }, [myBrainstorms]);

  const groupedIdeas = useMemo(() => {
    const groups: Record<IdeaStatus, Idea[]> = {
      validating: [],
      validated: [],
      shelved: [],
    };
    myIdeas.forEach((idea) => groups[idea.status].push(idea));
    return groups;
  }, [myIdeas]);

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

      const brainstorm = myBrainstorms.find((b) => b.id === brainstormId);
      if (!brainstorm || brainstorm.status === newStatus) return;

      setMyBrainstorms((current) =>
        current.map((b) =>
          b.id === brainstormId ? { ...b, status: newStatus } : b
        )
      );
      try {
        const res = await brainstormsApi.updateByOwnerAndSlug(
          token,
          user.username,
          brainstorm.slug,
          { status: newStatus }
        );
        setMyBrainstorms((current) =>
          current.map((b) =>
            b.id === brainstormId
              ? { ...b, status: res.brainstorm.status, updated_at: res.brainstorm.updated_at }
              : b
          )
        );
      } catch {
        setMyBrainstorms((current) =>
          current.map((b) =>
            b.id === brainstormId ? { ...b, status: brainstorm.status } : b
          )
        );
      }
    },
    [token, user?.username, myBrainstorms]
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
          current.map((i) =>
            i.id === ideaId ? { ...i, status: idea.status } : i
          )
        );
      }
    },
    [token, user?.username, myIdeas]
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
              <h2 className="text-lg font-semibold">My Brainstorms</h2>
              {loadingBrainstorms ? (
                <p className="text-sm text-zinc-500">Loading your brainstorms...</p>
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
                                {groupedBrainstorms[status].map((brainstorm) => (
                                  <DraggableBrainstormCard
                                    key={brainstorm.id}
                                    brainstorm={brainstorm}
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
              {loadingBrainstorms ? (
                <p className="text-sm text-zinc-500">Loading shared brainstorms...</p>
              ) : sharedBrainstorms.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No shared brainstorms yet. You will see collaborator and viewer brainstorms here.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {sharedBrainstorms.map((brainstorm) => (
                    <BrainstormCard key={brainstorm.id} brainstorm={brainstorm} />
                  ))}
                </div>
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
              <h2 className="text-lg font-semibold">My Ideas</h2>
              {loadingIdeas ? (
                <p className="text-sm text-zinc-500">Loading your ideas...</p>
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
