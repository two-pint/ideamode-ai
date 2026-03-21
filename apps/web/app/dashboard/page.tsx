"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Lightbulb, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { recentAccessApi, type RecentAccessItem } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

function formatAccessedAt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const { user, token, ready } = useRequireAuth();
  const [items, setItems] = useState<RecentAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecent = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await recentAccessApi.list(token);
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t load activity");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    loadRecent();
  }, [ready, token, loadRecent]);

  if (!ready || !user || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Welcome back, ${user.name || `@${user.username}`}`}
      active="dashboard"
    >
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/brainstorms" className="gap-2">
            <FolderKanban className="size-4" />
            Brainstorms
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/ideas" className="gap-2">
            <Lightbulb className="size-4" />
            Ideas
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            One feed of brainstorms and ideas you opened recently, newest first. Open a resource to
            add it here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nothing yet. Visit a brainstorm or idea to build your feed.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => {
                const href =
                  item.resource_type === "brainstorm"
                    ? `/${item.owner_username}/brainstorms/${item.slug}`
                    : `/${item.owner_username}/ideas/${item.slug}`;
                const isBrainstorm = item.resource_type === "brainstorm";
                return (
                  <li key={`${item.resource_type}-${item.owner_username}-${item.slug}`}>
                    <Link
                      href={href}
                      className="flex flex-col gap-3 py-3 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          @{item.owner_username}/{item.slug}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:pt-0.5">
                        <Badge variant={isBrainstorm ? "brainstorm" : "idea"}>
                          {isBrainstorm ? "Brainstorm" : "Idea"}
                        </Badge>
                        <time
                          className="text-xs text-zinc-500"
                          dateTime={item.accessed_at}
                        >
                          {formatAccessedAt(item.accessed_at)}
                        </time>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
