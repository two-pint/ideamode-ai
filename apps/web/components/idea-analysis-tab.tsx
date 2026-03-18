"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Loader2,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnalysisResultView } from "@/components/analysis-result-sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ideaAnalysesApi,
  type IdeaAnalysisItem,
  type IdeaAnalysisType,
} from "@/lib/api";

const ANALYSIS_TYPES: { type: IdeaAnalysisType; label: string; icon: typeof Users }[] = [
  { type: "competitor", label: "Competitor", icon: Users },
  { type: "tam", label: "TAM", icon: BarChart3 },
  { type: "pmf", label: "PMF", icon: TrendingUp },
  { type: "full", label: "Full report", icon: Target },
];

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
};

export function IdeaAnalysisTab({ username, slug, token, canEdit }: Props) {
  const [list, setList] = useState<IdeaAnalysisItem[]>([]);
  const [selected, setSelected] = useState<IdeaAnalysisItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningType, setRunningType] = useState<string | null>(null);
  const runningAnalysisIdRef = useRef<number | null>(null);
  const hasAutoSelected = useRef(false);

  const loadList = useCallback(async () => {
    try {
      const res = await ideaAnalysesApi.list(token, username, slug);
      setList(res.analyses);
      if (res.analyses.length > 0 && !hasAutoSelected.current) {
        hasAutoSelected.current = true;
        setSelected(res.analyses[0]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const pollUntilComplete = useCallback(
    async (analysis: IdeaAnalysisItem) => {
      if (analysis.status !== "pending" && analysis.status !== "running") return;
      const maxAttempts = 60;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const updated = await ideaAnalysesApi.get(token, username, slug, analysis.id);
        setList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setSelected((prev) => (prev?.id === updated.id ? updated : prev));
        if (updated.status === "completed" || updated.status === "failed") {
          if (runningAnalysisIdRef.current === analysis.id) {
            setRunning(false);
            setRunningType(null);
            runningAnalysisIdRef.current = null;
          }
          return;
        }
      }
      if (runningAnalysisIdRef.current === analysis.id) {
        setRunning(false);
        setRunningType(null);
        runningAnalysisIdRef.current = null;
      }
    },
    [token, username, slug]
  );

  const runAnalysis = async (analysisType: IdeaAnalysisType) => {
    if (!canEdit || running) return;
    setRunning(true);
    setRunningType(analysisType);
    try {
      const created = await ideaAnalysesApi.create(token, username, slug, analysisType);
      runningAnalysisIdRef.current = created.id;
      setList((prev) => [created, ...prev]);
      setSelected(created);
      pollUntilComplete(created);
    } catch (e) {
      console.error(e);
      setRunning(false);
      setRunningType(null);
      runningAnalysisIdRef.current = null;
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
            <CardTitle>Run analysis</CardTitle>
            <p className="text-sm text-zinc-500">
              AI-powered validation with web search. Each run is saved and versioned.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ANALYSIS_TYPES.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                disabled={running}
                onClick={() => runAnalysis(type)}
              >
                {runningType === type ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Icon className="mr-1 size-4" />
                )}
                {label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Analysis history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {list.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No analyses yet. {canEdit ? "Run one above." : ""}
            </p>
          ) : (
            <>
              <ul className="flex flex-wrap gap-2 border-b border-zinc-100 pb-2">
                {list.map((a) => (
                  <li key={a.id}>
                    <Button
                      variant={selected?.id === a.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelected(a)}
                    >
                      {a.analysis_type} – {new Date(a.created_at).toLocaleDateString()}
                      {a.status === "running" && <Loader2 className="ml-1 size-3 animate-spin" />}
                    </Button>
                  </li>
                ))}
              </ul>
              {selected && (
                <AnalysisResultView analysis={selected} running={running && runningType === selected.analysis_type} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
