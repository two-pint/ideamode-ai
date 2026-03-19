"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ideaPrdsApi, type IdeaPrdItem } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Props = {
  username: string;
  slug: string;
  token: string;
  canEdit: boolean;
};

export function IdeaPrdTab({ username, slug, token, canEdit }: Props) {
  const [prds, setPrds] = useState<IdeaPrdItem[]>([]);
  const [current, setCurrent] = useState<IdeaPrdItem | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const loadList = useCallback(async () => {
    try {
      const res = await ideaPrdsApi.list(token, username, slug);
      setPrds(res.prds);
      if (res.prds.length > 0 && !current) {
        setCurrent(res.prds[0]);
        setContent(res.prds[0].content);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, username, slug]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (current) setContent(current.content);
  }, [current?.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setContent("");
    setCurrent(null);
    try {
      await ideaPrdsApi.generate(token, username, slug, (chunk) => {
        setContent((prev) => prev + chunk);
      });
      await new Promise((r) => setTimeout(r, 500));
      const res = await ideaPrdsApi.list(token, username, slug);
      if (res.prds.length > 0) {
        const latest = res.prds[0];
        setCurrent(latest);
        setContent(latest.content);
      }
    } catch (e) {
      console.error(e);
      setContent((prev) => prev || "[Generation failed. Please try again.]");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!current || !canEdit) return;
    setSaving(true);
    try {
      const res = await ideaPrdsApi.update(token, username, slug, current.version, content);
      setCurrent(res.prd);
      await loadList();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (prd: IdeaPrdItem) => {
    setCurrent(prd);
    setContent(prd.content);
  };

  const handleExport = async (format: "md" | "pdf") => {
    if (!current) return;
    try {
      const blob = await ideaPrdsApi.export(token, username, slug, current.version, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prd-v${current.version}.${format === "pdf" ? "pdf" : "md"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-zinc-500">Loading PRDs…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>PRD</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Button type="button" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : null}
              Generate PRD
            </Button>
          )}
          {current && (
            <>
              {canEdit && (
                <Button type="button" size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => handleExport("md")}>
                <Download className="size-4" />
                Markdown
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="size-4" />
                PDF
              </Button>
              <button
                type="button"
                className="text-xs text-zinc-500 underline hover:text-zinc-700"
                onClick={() => setShowPreview((p) => !p)}
              >
                {showPreview ? "Hide preview" : "Show preview"}
              </button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {prds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-2">
            <span className="text-xs font-medium text-zinc-500">Version history:</span>
            {prds.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleRestore(p)}
                className={
                  current?.id === p.id
                    ? "rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white"
                    : "rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-200"
                }
              >
                v{p.version}
              </button>
            ))}
          </div>
        )}
        {!current && !generating && (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
            <p className="text-sm text-zinc-500">No PRD yet.</p>
            {canEdit && (
              <Button type="button" className="mt-2" onClick={handleGenerate} disabled={generating}>
                Generate PRD
              </Button>
            )}
          </div>
        )}
        {(current || content) && (
          <div className={showPreview ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "grid grid-cols-1"}>
            <div className="min-h-[300px]">
              {canEdit ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] w-full rounded-md border border-zinc-200 p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                  placeholder="PRD content (Markdown)..."
                  spellCheck={false}
                />
              ) : (
                <div className="prose prose-sm max-w-none rounded-md border border-zinc-200 p-4">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
            {showPreview && (
              <div className="prose prose-sm max-w-none rounded-md border border-zinc-200 bg-zinc-50/30 p-4">
                <ReactMarkdown>{content || "*No content*"}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
