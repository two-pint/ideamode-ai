"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Loader2,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const loadList = useCallback(async () => {
    try {
      const res = await ideaAnalysesApi.list(token, username, slug);
      setList(res.analyses);
      if (res.analyses.length > 0 && !selected) {
        setSelected(res.analyses[0]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [token, username, slug, selected]);

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
          setRunning(false);
          setRunningType(null);
          return;
        }
      }
      setRunning(false);
      setRunningType(null);
    },
    [token, username, slug]
  );

  const runAnalysis = async (analysisType: IdeaAnalysisType) => {
    if (!canEdit || running) return;
    setRunning(true);
    setRunningType(analysisType);
    try {
      const created = await ideaAnalysesApi.create(token, username, slug, analysisType);
      setList((prev) => [created, ...prev]);
      setSelected(created);
      pollUntilComplete(created);
    } catch (e) {
      console.error(e);
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

function AnalysisResultView({
  analysis,
  running,
}: {
  analysis: IdeaAnalysisItem;
  running: boolean;
}) {
  const { result, status } = analysis;
  const err = result?.error;

  if (running || status === "pending" || status === "running") {
    return (
      <div className="space-y-2 rounded-md border border-zinc-100 bg-zinc-50/50 p-4">
        <p className="text-sm text-zinc-600">
          {status === "pending" ? "Queued…" : "Running analysis…"}
        </p>
        <div className="h-2 w-full animate-pulse rounded bg-zinc-200" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-md border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-800">{err}</p>
      </div>
    );
  }

  const verdict = result?.verdict;
  const comp = result?.competitor_analysis;
  const market = result?.market_size;
  const pmf = result?.pmf_signals;

  return (
    <div className="space-y-6">
      {(verdict || analysis.analysis_type === "full") && verdict && (
        <VerdictBanner verdict={verdict} />
      )}
      {comp && (analysis.analysis_type === "competitor" || analysis.analysis_type === "full") && (
        <CompetitorSection data={comp} />
      )}
      {market && (analysis.analysis_type === "tam" || analysis.analysis_type === "full") && (
        <MarketSizeSection data={market} />
      )}
      {pmf && (analysis.analysis_type === "pmf" || analysis.analysis_type === "full") && (
        <PmfSection data={pmf} />
      )}
      {!verdict && !comp && !market && !pmf && (
        <p className="text-sm text-zinc-500">No result data.</p>
      )}
    </div>
  );
}

function VerdictBanner({
  verdict: { score = 0, recommendation, key_risks = [], next_steps = [] },
}: {
  verdict: NonNullable<IdeaAnalysisItem["result"]>["verdict"];
}) {
  const normalized = Math.min(100, Math.max(0, Number(score)));
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-20 shrink-0">
          <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-zinc-200"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
            />
            <path
              className="text-zinc-900"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${normalized}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
            {normalized}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900">{recommendation ?? "—"}</p>
          {key_risks.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase text-zinc-500">Key risks</p>
              <ul className="mt-1 list-inside list-disc text-sm text-zinc-700">
                {key_risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {next_steps.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase text-zinc-500">Next steps</p>
              <ul className="mt-1 list-inside list-disc text-sm text-zinc-700">
                {next_steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompetitorSection({
  data,
}: {
  data: NonNullable<IdeaAnalysisItem["result"]>["competitor_analysis"];
}) {
  const [open, setOpen] = useState(true);
  const { summary, competitors = [], saturation_score, whitespace } = data;
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50/50 p-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left font-medium text-zinc-900"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        Competitors
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {summary && <p className="whitespace-pre-wrap text-sm text-zinc-700">{summary}</p>}
          {saturation_score != null && (
            <p className="text-sm text-zinc-600">
              Saturation score: <strong>{saturation_score}</strong>/10
            </p>
          )}
          {competitors.map((c, i) => (
            <div key={i} className="rounded border border-zinc-200 bg-white p-3">
              <p className="font-medium text-zinc-900">{c.name}</p>
              {c.pricing && <p className="text-xs text-zinc-500">Pricing: {c.pricing}</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                {(c.strengths ?? []).map((s, j) => (
                  <Badge key={j} variant="secondary" className="text-xs">
                    + {s}
                  </Badge>
                ))}
                {(c.weaknesses ?? []).map((w, j) => (
                  <Badge key={j} variant="outline" className="text-xs">
                    − {w}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {whitespace && (
            <p className="text-sm text-zinc-700">
              <span className="font-medium">Whitespace:</span> {whitespace}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MarketSizeSection({
  data,
}: {
  data: NonNullable<IdeaAnalysisItem["result"]>["market_size"];
}) {
  const [open, setOpen] = useState(true);
  const { tam_estimate, sam_estimate, confidence, proxies_used = [] } = data;
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50/50 p-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left font-medium text-zinc-900"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        Market size (TAM / SAM)
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-4">
            <p className="text-sm">
              <span className="text-zinc-500">TAM:</span>{" "}
              <span className="font-medium">{tam_estimate ?? "—"}</span>
            </p>
            <p className="text-sm">
              <span className="text-zinc-500">SAM:</span>{" "}
              <span className="font-medium">{sam_estimate ?? "—"}</span>
            </p>
            {confidence && (
              <Badge variant="outline" className="capitalize">
                {confidence} confidence
              </Badge>
            )}
          </div>
          {proxies_used.length > 0 && (
            <p className="text-xs text-zinc-500">Proxies: {proxies_used.join("; ")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PmfSection({
  data,
}: {
  data: NonNullable<IdeaAnalysisItem["result"]>["pmf_signals"];
}) {
  const [open, setOpen] = useState(true);
  const { demand_evidence, pain_point_strength, willingness_to_pay_signals } = data;
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50/50 p-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left font-medium text-zinc-900"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        PMF signals
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm text-zinc-700">
          {demand_evidence && (
            <p>
              <span className="font-medium text-zinc-900">Demand evidence:</span> {demand_evidence}
            </p>
          )}
          {pain_point_strength && (
            <p>
              <span className="font-medium text-zinc-900">Pain point strength:</span>{" "}
              <Badge variant="outline" className="capitalize">
                {pain_point_strength}
              </Badge>
            </p>
          )}
          {willingness_to_pay_signals && (
            <p>
              <span className="font-medium text-zinc-900">Willingness to pay:</span>{" "}
              {willingness_to_pay_signals}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
