"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code) {
      router.replace("/login");
      return;
    }

    authApi
      .exchangeCode(code)
      .then(({ token, user }) => {
        setAuth(token, user);
        router.replace(user.username ? "/dashboard" : "/auth/set-username");
      })
      .catch(() => {
        router.replace("/login?error=Invalid+code");
      });
  }, [searchParams, setAuth, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Signing you in...</p>
        </main>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
