"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { authApi, ApiError } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);

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
    setError(null);
    setLoading(true);

    try {
      const { token, user } = await authApi.register({
        email,
        username,
        password,
        name: name || undefined,
      });
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="flex w-full justify-center">
            <Image
              src="/ideamode_logo_1.svg"
              alt="IdeaMode"
              width={140}
              height={21}
              priority
              unoptimized
            />
          </div>
          <CardTitle className="mt-2">Create your account</CardTitle>
          <CardDescription>Start capturing and validating ideas</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="janedoe"
                required
                autoComplete="username"
                minLength={3}
                maxLength={30}
              />
              <UsernameHint status={usernameStatus} error={usernameError} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">At least 8 characters</p>
            </div>

            <Button
              type="submit"
              disabled={loading || usernameStatus === "taken" || usernameStatus === "invalid"}
              className="w-full"
            >
              <UserPlus className="size-4" />
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="relative my-4 flex items-center">
            <Separator className="flex-1" />
            <span className="px-3 text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = authApi.googleAuthUrl();
            }}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
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

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
