"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.username) {
      router.replace("/auth/set-username");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">
        Welcome, {user.name || user.username}
      </h1>
      <p className="text-muted-foreground">@{user.username}</p>
      {user.avatar_url && (
        <img
          src={user.avatar_url}
          alt=""
          className="size-16 rounded-full"
        />
      )}
      <p className="text-sm text-muted-foreground">
        Dashboard coming in Ticket 1.2
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          logout();
          router.push("/login");
        }}
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </main>
  );
}
