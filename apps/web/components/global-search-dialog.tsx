"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Lightbulb, Loader2, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError, MAX_SEARCH_QUERY_LENGTH, searchApi, type GlobalSearchResultItem } from "@/lib/api";
import { toastError } from "@/lib/toast";

const RECENT_KEY = "ideamode_global_search_recent";
const RECENT_MAX = 5;
const DEBOUNCE_MS = 300;

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightTitle({ title, query }: { title: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{title}</>;
  const parts = title.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-400/25"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

function writeRecent(query: string) {
  const q = query.trim();
  if (!q || q.length > MAX_SEARCH_QUERY_LENGTH) return;
  const prev = readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase());
  const next = [q, ...prev].slice(0, RECENT_MAX);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export type GlobalSearchDialogProps = {
  token: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Opens the global search dialog (for use on trigger buttons). */
export function GlobalSearchShortcutHint({ className }: { className?: string }) {
  return (
    <kbd
      className={className}
    >
      <span className="text-xs">⌘</span>K
    </kbd>
  );
}

export function GlobalSearchDialog({ token, open, onOpenChange }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const trimmed = query.trim();
  const debouncedTrimmed = debouncedQuery.trim();

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  useEffect(() => {
    if (!token) return;

    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [token, onOpenChange]);

  useEffect(() => {
    if (!open || !token) return;
    if (debouncedTrimmed.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    if (debouncedTrimmed.length > MAX_SEARCH_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    searchApi
      .search(token, debouncedTrimmed, { limit: 30 })
      .then((res) => {
        if (!cancelled) setResults(res.results);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResults([]);
          if (e instanceof ApiError) {
            const data = e.data as { errors?: string[] } | undefined;
            toastError(data?.errors?.[0] ?? e.message);
          } else {
            toastError(e instanceof Error ? e.message : "Search failed");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, debouncedTrimmed]);

  const brainstorms = useMemo(
    () => results.filter((r) => r.type === "brainstorm"),
    [results]
  );
  const ideas = useMemo(() => results.filter((r) => r.type === "idea"), [results]);

  const navigateTo = useCallback(
    (item: GlobalSearchResultItem) => {
      const path =
        item.type === "brainstorm"
          ? `/${item.owner_username}/brainstorms/${item.slug}`
          : `/${item.owner_username}/ideas/${item.slug}`;
      writeRecent(trimmed || debouncedTrimmed);
      onOpenChange(false);
      setQuery("");
      setResults([]);
      router.push(path);
    },
    [router, trimmed, debouncedTrimmed, onOpenChange]
  );

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  };

  if (!token) return null;

  const showNoResults =
    !loading &&
    debouncedTrimmed.length > 0 &&
    debouncedTrimmed.length <= MAX_SEARCH_QUERY_LENGTH &&
    results.length === 0;

  const queryTooLong = trimmed.length > MAX_SEARCH_QUERY_LENGTH;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
        aria-describedby={undefined}
      >
        <div className="sr-only">
          <DialogTitle>Search brainstorms and ideas</DialogTitle>
          <DialogDescription>
            Find resources you can access. Results update as you type.
          </DialogDescription>
        </div>
        <Command shouldFilter={false} className="rounded-lg border-none shadow-none">
          <CommandInput
            placeholder="Search brainstorms and ideas…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[min(60vh,320px)]">
            {queryTooLong ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Query is too long (max {MAX_SEARCH_QUERY_LENGTH} characters). Shorten your search.
              </p>
            ) : null}

            {!queryTooLong && trimmed.length === 0 && recent.length > 0 ? (
              <CommandGroup heading="Recent">
                {recent.map((r) => (
                  <CommandItem
                    key={r}
                    value={`recent-${r}`}
                    onSelect={() => setQuery(r)}
                    className="cursor-pointer"
                  >
                    <Search className="size-4 opacity-50" />
                    <span>{r}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {!queryTooLong && trimmed.length === 0 && recent.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type to search brainstorms and ideas you own or collaborate on.
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching…
              </div>
            ) : null}

            {showNoResults ? (
              <CommandEmpty className="px-3 py-6 text-muted-foreground">
                No matches. Try different words, or go to the{" "}
                <Link href="/dashboard" className="text-foreground underline underline-offset-2">
                  dashboard
                </Link>
                .
              </CommandEmpty>
            ) : null}

            {!loading && brainstorms.length > 0 ? (
              <CommandGroup heading="Brainstorms">
                {brainstorms.map((item) => (
                  <CommandItem
                    key={`brainstorm-${item.id}`}
                    value={`brainstorm-${item.id}`}
                    onSelect={() => navigateTo(item)}
                    className="cursor-pointer"
                  >
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      <HighlightTitle title={item.title} query={debouncedTrimmed} />
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      @{item.owner_username}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {!loading && ideas.length > 0 ? (
              <CommandGroup heading="Ideas">
                {ideas.map((item) => (
                  <CommandItem
                    key={`idea-${item.id}`}
                    value={`idea-${item.id}`}
                    onSelect={() => navigateTo(item)}
                    className="cursor-pointer"
                  >
                    <Lightbulb className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      <HighlightTitle title={item.title} query={debouncedTrimmed} />
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      @{item.owner_username}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
