"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Home, Lightbulb, LogOut, Mail, UserRound, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { IdeaModeLogo } from "@/components/ideamode-logo";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  /** When set, replaces the default title heading (e.g. inline title editing). */
  titleSlot?: ReactNode;
  subtitle?: string;
  /** Renders below the title/subtitle inside the page header strip (e.g. resource overview). */
  headerExtension?: ReactNode;
  children: React.ReactNode;
  active?: "dashboard" | "brainstorms" | "ideas" | "profile" | "invitations" | "idea";
};

export function AppShell({
  title,
  titleSlot,
  subtitle,
  headerExtension,
  children,
  active = "dashboard",
}: AppShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const username = user?.username;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center">
              <IdeaModeLogo width={148} height={23} priority />
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active === "dashboard"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                <Home className="size-4" />
                Dashboard
              </Link>
              <Link
                href="/brainstorms"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active === "brainstorms"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                <FolderKanban className="size-4" />
                Brainstorms
              </Link>
              <Link
                href="/ideas"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active === "ideas"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                <Lightbulb className="size-4" />
                Ideas
              </Link>
              <Link
                href="/invitations"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active === "invitations"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                <Mail className="size-4" />
                Invitations
              </Link>
              {username && (
                <Link
                  href={`/${username}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active === "profile"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  <UserRound className="size-4" />
                  Profile
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
            <Link
              href={username ? `/${username}` : "/dashboard"}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700"
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

      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        {titleSlot ?? <h1 className="text-xl font-semibold">{title}</h1>}
        {subtitle && (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
        {headerExtension != null ? (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            {headerExtension}
          </div>
        ) : null}
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
    <span className="inline-flex size-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
      {fallback.slice(0, 1).toUpperCase()}
    </span>
  );
}
