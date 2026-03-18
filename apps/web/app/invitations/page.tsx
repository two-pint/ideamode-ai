"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PendingInviteItem, invitesApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function InvitationsPage() {
  const { token, ready } = useRequireAuth();
  const [invites, setInvites] = useState<PendingInviteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await invitesApi.listMine(token);
      setInvites(res.invites);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (ready && token) {
      fetchInvites();
    }
  }, [ready, token, fetchInvites]);

  if (!ready || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <AppShell title="Invitations" active="invitations">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          Loading invitations…
        </div>
      ) : invites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">
              When someone shares a brainstorm or idea with you by email, you’ll
              see the invitation here. You can also accept via the link they
              send you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            You have {invites.length} pending invitation
            {invites.length !== 1 ? "s" : ""}. Open the link to accept.
          </p>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li key={inv.token}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">
                        {inv.type === "brainstorm" ? "Brainstorm" : "Idea"}:{" "}
                        {inv.resource.title}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Invited by{" "}
                        {inv.invited_by.name ||
                          inv.invited_by.username ||
                          "Unknown"}
                        {inv.invited_by.username && (
                          <span> (@{inv.invited_by.username})</span>
                        )}
                      </p>
                      <p className="text-xs capitalize text-zinc-500">
                        Role: {inv.role}
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/invites/${inv.token}`}>
                        <Check className="size-4" />
                        Accept
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
