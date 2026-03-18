"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, invitesApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

type InviteState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "gone" }
  | { status: "wrong-email" }
  | { status: "ready"; data: Awaited<ReturnType<typeof invitesApi.getByToken>> }
  | { status: "accepting" }
  | { status: "accepted"; redirectUrl: string }
  | { status: "error"; message: string };

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const { user, token, ready } = useRequireAuth();
  const [state, setState] = useState<InviteState>({ status: "loading" });

  const fetchInvite = useCallback(async () => {
    if (!token || !params.token) return;
    try {
      const data = await invitesApi.getByToken(token, params.token);
      setState({ status: "ready", data });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setState({ status: "not-found" });
          return;
        }
        if (err.status === 410) {
          setState({ status: "gone" });
          return;
        }
        if (err.status === 403) {
          setState({ status: "wrong-email" });
          return;
        }
      }
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }, [token, params.token]);

  useEffect(() => {
    if (!ready || !token) return;
    setState({ status: "loading" });
    fetchInvite();
  }, [ready, token, fetchInvite]);

  const handleAccept = async () => {
    if (!token || !params.token || state.status !== "ready") return;
    setState({ status: "accepting" });
    try {
      const res = await invitesApi.accept(token, params.token);
      const base = `/${res.resource.owner_username}`;
      const path =
        res.resource_type === "brainstorm"
          ? `${base}/brainstorms/${res.resource.slug}`
          : `${base}/ideas/${res.resource.slug}`;
      setState({ status: "accepted", redirectUrl: path });
      window.location.href = path;
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to accept invite.",
      });
    }
  };

  if (!ready || !user || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <AppShell title="Invitation" active="dashboard">
      <div className="mx-auto max-w-md">
        {state.status === "loading" && (
          <Card>
            <CardContent className="flex items-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm text-zinc-500">Loading invitation…</span>
            </CardContent>
          </Card>
        )}

        {state.status === "not-found" && (
          <Card>
            <CardHeader>
              <CardTitle>Invite not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-zinc-600">
                This invite link may be invalid or expired.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.status === "gone" && (
          <Card>
            <CardHeader>
              <CardTitle>Invite no longer valid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-zinc-600">
                This invite has already been accepted or has expired.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.status === "wrong-email" && (
          <Card>
            <CardHeader>
              <CardTitle>Wrong account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-zinc-600">
                This invite was sent to a different email address. Sign in with
                the email that received the invite to accept it.
              </p>
              <Button asChild variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.status === "ready" && state.data && (
          <Card>
            <CardHeader>
              <CardTitle>Invitation</CardTitle>
              <p className="text-sm text-zinc-500">
                You have been invited to collaborate
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  {state.data.type === "brainstorm" ? "Brainstorm" : "Idea"}
                </p>
                <p className="text-lg font-semibold text-zinc-900">
                  {state.data.resource.title}
                </p>
              </div>
              <div className="text-sm text-zinc-600">
                <p>
                  Invited by{" "}
                  {state.data.invited_by.name || state.data.invited_by.username || "Unknown"}{" "}
                  {state.data.invited_by.username && (
                    <span className="text-zinc-500">@{state.data.invited_by.username}</span>
                  )}
                </p>
                <p className="capitalize text-zinc-500">Role: {state.data.role}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAccept}>
                  <Check className="size-4" />
                  Accept
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Decline</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state.status === "accepting" && (
          <Card>
            <CardContent className="flex items-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm text-zinc-500">Accepting…</span>
            </CardContent>
          </Card>
        )}

        {state.status === "accepted" && (
          <Card>
            <CardContent className="flex items-center gap-2 py-8">
              <Check className="size-5 text-green-600" />
              <span className="text-sm text-zinc-500">Redirecting…</span>
            </CardContent>
          </Card>
        )}

        {state.status === "error" && (
          <Card>
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-red-600">{state.message}</p>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
