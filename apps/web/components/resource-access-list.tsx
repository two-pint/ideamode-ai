"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, UserRound } from "lucide-react";
import {
  type Invite,
  type Member,
  type ResourceType,
  membersApi,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toastError, toastSuccess } from "@/lib/toast";

type ResourceAccessListProps = {
  resourceType: ResourceType;
  ownerUsername: string;
  slug: string;
  token: string | null;
  /** When true, show Remove button for members and invites. */
  canManage: boolean;
  /** When this value changes, the list is refetched (e.g. close Share dialog). */
  refreshTrigger?: unknown;
};

export function ResourceAccessList({
  resourceType,
  ownerUsername,
  slug,
  token,
  canManage,
  refreshTrigger,
}: ResourceAccessListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await membersApi.list(token, ownerUsername, slug, resourceType);
      setMembers(res.members);
      setInvites(res.invites);
    } catch {
      setMembers([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [token, ownerUsername, slug, resourceType]);

  useEffect(() => {
    if (token) fetchList();
  }, [token, fetchList, refreshTrigger]);

  const handleRemove = async (id: number) => {
    if (!token) return;
    setRemovingId(id);
    try {
      await membersApi.remove(token, ownerUsername, slug, resourceType, id);
      await fetchList();
      toastSuccess("Access updated");
    } catch {
      toastError("Couldn’t remove access");
    } finally {
      setRemovingId(null);
    }
  };

  if (!token) return null;

  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <UserRound className="size-4" />
        People with access
      </h3>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <ul className="space-y-1.5">
          <li className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="font-medium">@{ownerUsername}</span>
            <span className="text-xs text-zinc-500">Owner</span>
          </li>
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">
                    @{m.username || `user-${m.user_id}`}
                  </span>
                  <span className="text-xs capitalize text-zinc-500">
                    {m.role}
                  </span>
                </div>
                {m.name && (
                  <p className="text-xs text-zinc-500">{m.name}</p>
                )}
              </div>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(m.id)}
                  disabled={removingId === m.id}
                  aria-label={`Remove ${m.username || m.name || `user ${m.user_id}`}`}
                >
                  {removingId === m.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              )}
            </li>
          ))}
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 border-dashed px-3 py-2 text-sm dark:border-zinc-700"
            >
              <div className="min-w-0">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {inv.email}
                </span>
                <span className="ml-1.5 text-xs capitalize text-zinc-500">
                  {inv.role} (pending)
                </span>
              </div>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(inv.id)}
                  disabled={removingId === inv.id}
                  aria-label={`Cancel invite for ${inv.email}`}
                >
                  {removingId === inv.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!loading && members.length === 0 && invites.length === 0 && (
        <p className="text-sm text-zinc-500">
          Only the owner has access. Use Share to invite others.
        </p>
      )}
    </section>
  );
}
