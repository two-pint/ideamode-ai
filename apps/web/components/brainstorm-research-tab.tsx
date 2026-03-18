"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  brainstormResearchApi,
  type BrainstormResearchItem,
} from "@/lib/api";

const RESEARCH_TYPES = [
  { type: "market_lookup", label: "Market lookup", icon: BarChart3 },
  { type: "competitor_spot", label: "Competitor spot", icon: Users },
  { type: "trend_signal", label: "Trend signal", icon: TrendingUp },
] as const;

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
};

export function BrainstormResearchTab({
  username,
  slug,
  token,
  canEdit,
}: Props) {
  const [list, setList] = useState<BrainstormResearchItem[]>([]);
  const [selected, setSelected] = useState<BrainstormResearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [runningType, setRunningType] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await brainstormResearchApi.list(token, username, slug);
      setList(res.research);
      setSelected((prev) => (res.research.length > 0 && !prev ? res.research[0] : prev));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const runResearch = async (researchType: string) => {
    if (!canEdit || running) return;
    setRunning(true);
    setRunningType(researchType);
    try {
      const res = await brainstormResearchApi.create(token, username, slug, {
        research_type: researchType,
        query: query.trim() || "general market",
      });
      setList((prev) => [res.research, ...prev]);
      setSelected(res.research);
      setQuery("");
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
      setRunningType(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-1/3 rounded bg-zinc-200" />
            <div className="h-20 rounded bg-zinc-100" />
            <div className="h-32 rounded bg-zinc-100" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Run research</CardTitle>
            <p className="text-sm text-zinc-500">
              Use AI and web search to gather signals. Each run is saved.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Query (e.g. task management tools for small teams)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={running}
            />
            <div className="flex flex-wrap gap-2">
              {RESEARCH_TYPES.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  disabled={running}
                  onClick={() => runResearch(type)}
                >
                  {runningType === type ? (
                    <span className="animate-pulse">Running…</span>
                  ) : (
                    <>
                      <Icon className="mr-1 size-4" />
                      {label}
                    </>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Research history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {list.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No research runs yet. {canEdit ? "Run one above." : ""}
            </p>
          ) : (
            <>
              <ul className="flex flex-wrap gap-2 border-b border-zinc-100 pb-2">
                {list.map((r) => (
                  <li key={r.id}>
                    <Button
                      variant={selected?.id === r.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelected(r)}
                    >
                      {r.research_type.replace(/_/g, " ")} – {new Date(r.created_at).toLocaleDateString()}
                    </Button>
                  </li>
                ))}
              </ul>
              {selected && (
                <ResearchResultCard research={selected} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResearchResultCard({ research }: { research: BrainstormResearchItem }) {
  const { result, query, research_type } = research;
  const summary = result?.summary ?? result?.error ?? "No content.";
  const links = result?.links ?? [];
  const competitors = result?.competitors ?? [];
  const takeaways = result?.key_takeaways ?? [];

  return (
    <div className="space-y-3 rounded-md border border-zinc-100 bg-zinc-50/50 p-4">
      <p className="text-xs uppercase text-zinc-500">
        {research_type.replace(/_/g, " ")} · {query}
      </p>
      <div>
        <h4 className="text-sm font-medium text-zinc-900">Summary</h4>
        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{summary}</p>
      </div>
      {competitors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-900">Competitors</h4>
          <ul className="mt-1 space-y-1">
            {competitors.map((c, i) => (
              <li key={i} className="text-sm">
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-900 underline"
                  >
                    {c.name}
                  </a>
                ) : (
                  <span className="text-zinc-900">{c.name}</span>
                )}
                {c.one_liner && (
                  <span className="text-zinc-600"> — {c.one_liner}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {links.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-900">Links</h4>
          <ul className="mt-1 space-y-1">
            {links.map((l, i) => (
              <li key={i}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-900 underline"
                >
                  {l.title || l.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {takeaways.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-900">Key takeaways</h4>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-zinc-700">
            {takeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
