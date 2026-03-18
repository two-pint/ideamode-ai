"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import {
  type Invite,
  type Member,
  type ResourceType,
  ApiError,
  membersApi,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ResourceType;
  resourceTitle: string;
  ownerUsername: string;
  slug: string;
  token: string | null;
};

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceTitle,
  ownerUsername,
  slug,
  token,
}: ShareDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmailOrUsername, setInviteEmailOrUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"collaborator" | "viewer">("collaborator");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await membersApi.list(token, ownerUsername, slug, resourceType);
      setMembers(res.members);
      setInvites(res.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, [token, ownerUsername, slug, resourceType]);

  useEffect(() => {
    if (open && token) {
      fetchList();
    }
  }, [open, token, fetchList]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = inviteEmailOrUsername.trim();
    if (!token || !value) {
      setInviteError("Enter an email or username.");
      return;
    }
    setInviteError(null);
    setInviting(true);
    try {
      const isEmail = value.includes("@");
      await membersApi.create(token, ownerUsername, slug, resourceType, {
        ...(isEmail ? { email: value.toLowerCase() } : { invitee_username: value }),
        role: inviteRole,
      });
      setInviteEmailOrUsername("");
      await fetchList();
    } catch (err) {
      setInviteError(
        err instanceof ApiError ? err.message : "Failed to send invite."
      );
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: number, role: "collaborator" | "viewer") => {
    if (!token) return;
    setUpdatingId(memberId);
    try {
      await membersApi.updateRole(
        token,
        ownerUsername,
        slug,
        resourceType,
        memberId,
        role
      );
      await fetchList();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyInviteLink = (inv: { id: number; token?: string }) => {
    if (typeof window === "undefined" || !inv.token) return;
    const url = `${window.location.origin}/invites/${inv.token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedInviteId(inv.id);
      setTimeout(() => setCopiedInviteId(null), 2000);
    });
  };

  const handleRemove = async (id: number) => {
    if (!token) return;
    setRemovingId(id);
    try {
      await membersApi.remove(token, ownerUsername, slug, resourceType, id);
      await fetchList();
    } finally {
      setRemovingId(null);
    }
  };

  if (!open) return null;

  const label = resourceType === "brainstorm" ? "Brainstorm" : "Idea";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 dark:bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 id="share-dialog-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Share {label}
          </h2>
          <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
            {resourceTitle}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              <section>
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Members
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-800/50">
                    <span className="font-medium">@{ownerUsername}</span>
                    <span className="text-xs text-zinc-500">Owner</span>
                  </li>
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">
                          {m.name || m.username || `User ${m.user_id}`}
                        </span>
                        {m.username && (
                          <span className="ml-1 text-zinc-500">@{m.username}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={m.role}
                          onValueChange={(value) =>
                            handleUpdateRole(m.id, value as "collaborator" | "viewer")
                          }
                          disabled={updatingId === m.id}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="collaborator">Collaborator</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-zinc-500 hover:text-red-600"
                          onClick={() => handleRemove(m.id)}
                          disabled={removingId === m.id}
                          aria-label={`Remove ${m.name || m.username}`}
                        >
                          {removingId === m.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {invites.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Pending invites
                  </h3>
                  <ul className="space-y-2">
                    {invites.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                      >
                        <span className="min-w-0 truncate">{inv.email}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="capitalize text-zinc-500">{inv.role}</span>
                          {inv.token && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-zinc-500 hover:text-zinc-700"
                              onClick={() => handleCopyInviteLink(inv)}
                              aria-label={`Copy invite link for ${inv.email}`}
                            >
                              {copiedInviteId === inv.id ? (
                                <span className="text-xs">Copied!</span>
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-zinc-500 hover:text-red-600"
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
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Invite by email or username
                </h3>
                <form onSubmit={handleInvite} className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="share-email-or-username">Email or username</Label>
                    <Input
                      id="share-email-or-username"
                      type="text"
                      autoComplete="off"
                      value={inviteEmailOrUsername}
                      onChange={(e) => setInviteEmailOrUsername(e.target.value)}
                      placeholder="colleague@example.com or username"
                      disabled={inviting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="share-role">Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as "collaborator" | "viewer")}
                    >
                      <SelectTrigger id="share-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collaborator">Collaborator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {inviteError && (
                    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                      {inviteError}
                    </p>
                  )}
                  <Button type="submit" disabled={inviting}>
                    {inviting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}
                    Invite
                  </Button>
                </form>
              </section>
            </>
          )}
        </div>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
