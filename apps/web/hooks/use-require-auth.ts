"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function useRequireAuth(options?: { requireUsername?: boolean }) {
  const { requireUsername = true } = options || {};
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.loading) return;

    if (!auth.user || !auth.token) {
      router.replace("/login");
      return;
    }

    if (requireUsername && !auth.user.username) {
      router.replace("/auth/set-username");
    }
  }, [auth.loading, auth.user, auth.token, requireUsername, router]);

  const ready =
    !auth.loading &&
    !!auth.user &&
    !!auth.token &&
    (!requireUsername || !!auth.user.username);

  return { ...auth, ready };
}
