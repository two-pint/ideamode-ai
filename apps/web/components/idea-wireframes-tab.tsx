"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ideaWireframesApi, type IdeaWireframeItem } from "@/lib/api";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

const DEBOUNCE_MS = 2000;

/** Excalidraw expects appState.collaborators to be array-like (forEach); saved data may have it as {}. */
function normalizeAppState(appState: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!appState || typeof appState !== "object") return {};
  const next = { ...appState };
  if (next.collaborators != null && !Array.isArray(next.collaborators) && typeof (next.collaborators as Record<string, unknown>).forEach !== "function") {
    next.collaborators = Object.values(next.collaborators as Record<string, unknown>);
  }
  return next;
}

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
};

export function IdeaWireframesTab({ username, slug, token, canEdit }: Props) {
  const [wireframes, setWireframes] = useState<IdeaWireframeItem[]>([]);
  const [selected, setSelected] = useState<IdeaWireframeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await ideaWireframesApi.list(token, username, slug);
      setWireframes(res.wireframes);
      if (res.wireframes.length > 0 && !selected) {
        setSelected(res.wireframes[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const saveCanvas = useCallback(
    async (wireframe: IdeaWireframeItem, canvasData: Record<string, unknown>) => {
      setSaving(true);
      try {
        const res = await ideaWireframesApi.update(
          token,
          username,
          slug,
          wireframe.id,
          { canvas_data: canvasData }
        );
        setWireframes((prev) => prev.map((w) => (w.id === wireframe.id ? res.wireframe : w)));
        if (selected?.id === wireframe.id) setSelected(res.wireframe);
        lastSavedDataRef.current = JSON.stringify(canvasData);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    },
    [token, username, slug, selected?.id]
  );

  const handleExcalidrawChange = useCallback(
    (elements: unknown, appState: unknown, files: unknown) => {
      if (!selected || !canEdit) return;
      const canvasData = { elements, appState, files };
      if (JSON.stringify(canvasData) === lastSavedDataRef.current) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveCanvas(selected, canvasData as Record<string, unknown>);
      }, DEBOUNCE_MS);
    },
    [selected, canEdit, saveCanvas]
  );

  const handleAdd = async () => {
    try {
      const res = await ideaWireframesApi.create(token, username, slug, {
        title: "Untitled wireframe",
        canvas_data: {},
      });
      setWireframes((prev) => [res.wireframe, ...prev]);
      setSelected(res.wireframe);
    } catch (e) {
      console.error(e);
    }
  };

  const startRename = (w: IdeaWireframeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(w.id);
    setEditingTitleValue(w.title);
  };

  const saveRename = useCallback(async () => {
    if (editingTitleId == null) return;
    const id = editingTitleId;
    const title = editingTitleValue.trim() || "Untitled wireframe";
    setEditingTitleId(null);
    setEditingTitleValue("");
    try {
      const res = await ideaWireframesApi.update(token, username, slug, id, { title });
      setWireframes((prev) => prev.map((w) => (w.id === id ? res.wireframe : w)));
      if (selected?.id === id) setSelected(res.wireframe);
    } catch (e) {
      console.error(e);
    }
  }, [editingTitleId, editingTitleValue, token, username, slug, selected?.id]);

  const cancelRename = () => {
    setEditingTitleId(null);
    setEditingTitleValue("");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-zinc-500">Loading wireframes…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Wireframes</CardTitle>
        {canEdit && (
          <Button type="button" size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            New frame
          </Button>
        )}
        {saving && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Loader2 className="size-3 animate-spin" />
            Saving…
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {wireframes.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <aside className="flex flex-wrap gap-1 sm:w-40 sm:flex-col">
              {wireframes.map((w) => (
                <div
                  key={w.id}
                  className={
                    selected?.id === w.id
                      ? "flex items-center gap-1 rounded-md border-2 border-zinc-900 bg-zinc-100"
                      : "flex items-center gap-1 rounded-md border border-zinc-200"
                  }
                >
                  {editingTitleId === w.id ? (
                    <input
                      type="text"
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={saveRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-0 flex-1 rounded border-0 bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-zinc-400"
                      autoFocus
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelected(w)}
                        className={
                          "min-w-0 flex-1 px-2 py-1 text-left text-sm " +
                          (selected?.id === w.id ? "font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-50")
                        }
                      >
                        {w.title}
                      </button>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-7 shrink-0 p-0 text-zinc-500 hover:text-zinc-700"
                          onClick={(e) => startRename(w, e)}
                          aria-label="Rename wireframe"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </aside>
            <div className="min-h-[400px] flex-1 overflow-hidden rounded-md border border-zinc-200 bg-white">
              {selected && (
                <div className="h-[500px] w-full overflow-hidden [&_.excalidraw]:!h-full [&_.excalidraw]:!max-h-full">
                  <Excalidraw
                    key={selected.id}
                    initialData={{
                      elements: Array.isArray(selected.canvas_data?.elements) ? selected.canvas_data.elements : [],
                      appState: normalizeAppState(selected.canvas_data?.appState as Record<string, unknown>),
                      // Persisted JSON; Excalidraw types BinaryFiles strictly
                      files: (selected.canvas_data?.files ?? {}) as never,
                    }}
                    onChange={handleExcalidrawChange}
                    viewModeEnabled={!canEdit}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {wireframes.length === 0 && (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
            <p className="text-sm text-zinc-500">No wireframes yet.</p>
            {canEdit && (
              <Button type="button" className="mt-2" onClick={handleAdd}>
                <Plus className="size-4" />
                Create wireframe
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
