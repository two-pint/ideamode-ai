"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ideaTasksApi, type IdeaTaskItem } from "@/lib/api";

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
};

export function IdeaTasksTab({ username, slug, token, canEdit }: Props) {
  const [tasks, setTasks] = useState<IdeaTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [completedOpen, setCompletedOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await ideaTasksApi.list(token, username, slug);
      setTasks(res.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const handleAdd = async () => {
    const title = newTitle.trim() || "Untitled task";
    const due_date = newDueDate.trim() || undefined;
    setNewTitle("");
    setNewDueDate("");
    try {
      const res = await ideaTasksApi.create(token, username, slug, { title, due_date });
      setTasks((prev) => [...prev, res.task]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (task: IdeaTaskItem) => {
    setUpdatingId(task.id);
    try {
      const res = await ideaTasksApi.update(token, username, slug, task.id, {
        completed: !task.completed,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.task : t)));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (task: IdeaTaskItem) => {
    try {
      await ideaTasksApi.delete(token, username, slug, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      console.error(e);
    }
  };

  const formatDueDate = (due_date: string | null) => {
    if (!due_date) return null;
    try {
      return new Date(due_date).toLocaleDateString(undefined, { dateStyle: "short" });
    } catch {
      return due_date;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-zinc-500">Loading tasks…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEdit && (
          <div className="flex flex-wrap items-end gap-2">
            <Input
              placeholder="New task…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="max-w-xs"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
            />
            <Button type="button" size="sm" onClick={handleAdd}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        )}
        <ul className="space-y-1">
          {incomplete.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              canEdit={canEdit}
              updating={updatingId === task.id}
              onToggle={() => handleToggle(task)}
              onDelete={() => handleDelete(task)}
              formatDueDate={formatDueDate}
            />
          ))}
        </ul>
        {completed.length > 0 && (
          <div className="border-t border-zinc-200 pt-3">
            <button
              type="button"
              className="flex w-full items-center gap-1 text-left text-sm font-medium text-zinc-600 hover:text-zinc-900"
              onClick={() => setCompletedOpen((o) => !o)}
            >
              {completedOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              Completed ({completed.length})
            </button>
            {completedOpen && (
              <ul className="mt-1 space-y-1">
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    canEdit={canEdit}
                    updating={updatingId === task.id}
                    onToggle={() => handleToggle(task)}
                    onDelete={() => handleDelete(task)}
                    formatDueDate={formatDueDate}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
        {tasks.length === 0 && !canEdit && <p className="text-sm text-zinc-500">No tasks yet.</p>}
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task,
  canEdit,
  updating,
  onToggle,
  onDelete,
  formatDueDate,
}: {
  task: IdeaTaskItem;
  canEdit: boolean;
  updating: boolean;
  onToggle: () => void;
  onDelete: () => void;
  formatDueDate: (d: string | null) => string | null;
}) {
  const due = formatDueDate(task.due_date);
  return (
    <li className="flex items-center gap-2 rounded-md border border-zinc-100 px-2 py-1.5">
      {canEdit ? (
        <button
          type="button"
          onClick={onToggle}
          disabled={updating}
          className="flex-shrink-0 rounded border border-zinc-300 p-0.5 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {updating ? (
            <Loader2 className="size-4 animate-spin text-zinc-400" />
          ) : task.completed ? (
            <span className="block size-4 rounded bg-green-500 text-white">✓</span>
          ) : (
            <span className="block size-4 rounded border border-zinc-400" />
          )}
        </button>
      ) : task.completed ? (
        <span className="flex-shrink-0 text-green-600">✓</span>
      ) : null}
      <span className={task.completed ? "flex-1 text-zinc-500 line-through" : "flex-1 text-zinc-900"}>
        {task.title}
      </span>
      {due && (
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <Calendar className="size-3" />
          {due}
        </span>
      )}
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-zinc-500 hover:text-red-600"
          onClick={onDelete}
          aria-label="Delete task"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  );
}
