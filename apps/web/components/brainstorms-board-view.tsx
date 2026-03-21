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
import { DraggableBrainstormCard } from "@/components/draggable-brainstorm-card";
import { DroppableLane } from "@/components/droppable-lane";
import { NewBrainstormModal } from "@/components/new-brainstorm-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type Brainstorm,
  type BrainstormStatus,
  brainstormsApi,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

const BRAINSTORM_STATUSES: readonly BrainstormStatus[] = [
  "exploring",
  "researching",
  "ready",
  "archived",
];

export function BrainstormsBoardView() {
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [loadingBrainstorms, setLoadingBrainstorms] = useState(true);
  const [myBrainstorms, setMyBrainstorms] = useState<Brainstorm[]>([]);
  const [sharedBrainstorms, setSharedBrainstorms] = useState<Brainstorm[]>([]);
  const [isBrainstormModalOpen, setBrainstormModalOpen] = useState(false);
  const lastBrainstormOverIdRef = useRef<string | null>(null);

  const allBrainstorms = useMemo(
    () => [...myBrainstorms, ...sharedBrainstorms],
    [myBrainstorms, sharedBrainstorms]
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
      const brainstormId = Number(dragId.slice(11));
      if (Number.isNaN(brainstormId)) return;

      const brainstorm = allBrainstorms.find((b) => b.id === brainstormId);
      if (!brainstorm || brainstorm.status === newStatus) return;
      const ownerUsername = brainstorm.owner?.username ?? user?.username;
      if (!ownerUsername) return;

      const isMine = brainstorm.owner?.username === user?.username;
      const setter = isMine ? setMyBrainstorms : setSharedBrainstorms;

      setter((current) =>
        current.map((b) => (b.id === brainstormId ? { ...b, status: newStatus } : b))
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
          current.map((b) => (b.id === brainstormId ? { ...b, status: brainstorm.status } : b))
        );
      }
    },
    [token, user?.username, allBrainstorms]
  );

  useEffect(() => {
    if (!ready) return;
    loadBrainstorms();
  }, [ready, loadBrainstorms]);

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
        title="Brainstorms"
        subtitle="Drag cards between lanes to update status."
        active="brainstorms"
      >
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
                          <p className="text-sm text-zinc-500">No brainstorms in this lane.</p>
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
    </>
  );
}
