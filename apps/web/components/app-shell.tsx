"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Home, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  active?: "dashboard" | "profile" | "idea";
};

export function AppShell({ title, subtitle, children, active = "dashboard" }: AppShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const username = user?.username;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/ideamode_logo_1.svg"
                alt="IdeaMode"
                width={148}
                height={23}
                priority
                unoptimized
                className="h-6 w-auto"
              />
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active === "dashboard"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                <Home className="size-4" />
                Dashboard
              </Link>
              {username && (
                <Link
                  href={`/${username}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active === "profile"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  )}
                >
                  <UserRound className="size-4" />
                  Profile
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={username ? `/${username}` : "/dashboard"}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
            >
              <Avatar src={user?.avatar_url} fallback={user?.name || user?.username || "U"} />
              <span>{user?.name || `@${user?.username || "user"}`}</span>
            </Link>
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
          </div>
        </div>
      </header>

      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>

      <main className="p-6">{children}</main>
    </div>
  );
}

function Avatar({ src, fallback }: { src: string | null | undefined; fallback: string }) {
  if (src) {
    return <img src={src} alt="" className="size-7 rounded-full object-cover" />;
  }

  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
      {fallback.slice(0, 1).toUpperCase()}
    </span>
  );
}
