"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AtSign } from "lucide-react";
import { IdeaModeLogo } from "@/components/ideamode-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { authApi, ApiError } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

export default function SetUsernamePage() {
  const router = useRouter();
  const { user, token, loading: authLoading, setAuth } = useAuth();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.replace("/login");
    } else if (user.username) {
      router.replace("/dashboard");
    }
  }, [user, token, authLoading, router]);

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) {
      setUsernameStatus("idle");
      setUsernameError(null);
      return;
    }

    setUsernameStatus("checking");
    try {
      const res = await authApi.checkUsername(value);
      if (res.available) {
        setUsernameStatus("available");
        setUsernameError(null);
      } else {
        setUsernameStatus(res.error?.includes("must be") ? "invalid" : "taken");
        setUsernameError(res.error || "Username is taken");
      }
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  useDebounce(username, 400, checkUsername);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setSubmitting(true);

    try {
      const { user: updatedUser } = await authApi.setUsername(token, username);
      setAuth(token, updatedUser);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to set username");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="flex w-full justify-center">
            <IdeaModeLogo width={140} height={21} priority className="h-5 w-auto" />
          </div>
          <CardTitle className="mt-2">Choose a username</CardTitle>
          <CardDescription>
            Your username is your unique URL namespace (e.g. ideamode.ai/<strong>you</strong>)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="janedoe"
                required
                minLength={3}
                maxLength={30}
                autoFocus
              />
              <UsernameHint status={usernameStatus} error={usernameError} />
            </div>

            <Button
              type="submit"
              disabled={
                submitting ||
                usernameStatus === "taken" ||
                usernameStatus === "invalid" ||
                username.length < 3
              }
              className="w-full"
            >
              <AtSign className="size-4" />
              {submitting ? "Setting username..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function UsernameHint({
  status,
  error,
}: {
  status: "idle" | "checking" | "available" | "taken" | "invalid";
  error: string | null;
}) {
  if (status === "idle") return null;
  if (status === "checking") {
    return <p className="text-xs text-muted-foreground">Checking availability...</p>;
  }
  if (status === "available") {
    return <p className="text-xs text-green-600">Username is available</p>;
  }
  return <p className="text-xs text-destructive">{error}</p>;
}
