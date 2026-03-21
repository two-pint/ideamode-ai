"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Home,
  Lightbulb,
  LogOut,
  Mail,
  Menu,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { IdeaModeLogo } from "@/components/ideamode-logo";
import { cn } from "@/lib/utils";

type NavKey = "dashboard" | "brainstorms" | "ideas" | "profile" | "invitations" | "idea";

type AppShellProps = {
  title: string;
  /** When set, replaces the default title heading (e.g. inline title editing). */
  titleSlot?: ReactNode;
  subtitle?: string;
  /** Renders below the title/subtitle inside the page header strip (e.g. resource overview). */
  headerExtension?: ReactNode;
  /** Renders in the page header strip, aligned with the title row (e.g. primary actions). */
  headerActions?: ReactNode;
  children: React.ReactNode;
  active?: NavKey;
  /**
   * When true, the main content area fills the viewport below the page header so nested
   * layouts (e.g. chat) can use flex + min-h-0 for full-height panels. Default scrolls as one column.
   */
  fillHeight?: boolean;
};

const navItems: { href: string; label: string; icon: typeof Home; match: NavKey }[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, match: "dashboard" },
  { href: "/brainstorms", label: "Brainstorms", icon: FolderKanban, match: "brainstorms" },
  { href: "/ideas", label: "Ideas", icon: Lightbulb, match: "ideas" },
  { href: "/invitations", label: "Invitations", icon: Mail, match: "invitations" },
];

function navLinkClass(activeNav: boolean) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
    activeNav
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
  );
}

export function AppShell({
  title,
  titleSlot,
  subtitle,
  headerExtension,
  headerActions,
  children,
  active = "dashboard",
  fillHeight = false,
}: AppShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const username = user?.username;

  const closeMobileNav = () => setMobileNavOpen(false);

  const sidebarInner = (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-zinc-200 px-4 dark:border-zinc-800 md:h-16 md:px-5">
        <Link href="/dashboard" className="flex items-center" onClick={closeMobileNav}>
          <IdeaModeLogo width={132} height={20} priority />
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          aria-label="Close menu"
          onClick={closeMobileNav}
        >
          <X className="size-5" />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map(({ href, label, icon: Icon, match }) => (
          <Link
            key={href}
            href={href}
            className={navLinkClass(active === match)}
            onClick={closeMobileNav}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
        {username && (
          <Link
            href={`/${username}`}
            className={navLinkClass(active === "profile" || active === "idea")}
            onClick={closeMobileNav}
          >
            <UserRound className="size-4 shrink-0" />
            Profile
          </Link>
        )}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
        <Link
          href={username ? `/${username}` : "/dashboard"}
          className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
          onClick={closeMobileNav}
        >
          <Avatar src={user?.avatar_url} fallback={user?.name || user?.username || "U"} />
          <span className="min-w-0 truncate">{user?.name || `@${user?.username || "user"}`}</span>
        </Link>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            closeMobileNav();
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 max-w-[85vw] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          "transition-transform duration-200 ease-out md:static md:z-auto md:max-w-none md:translate-x-0",
          mobileNavOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarInner}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <Link href="/dashboard" className="flex min-w-0 items-center">
            <IdeaModeLogo width={112} height={18} priority />
          </Link>
        </header>

        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
          <div
            className={cn(
              "flex flex-col gap-3",
              headerActions != null && "sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            )}
          >
            <div className="min-w-0 flex-1">
              {titleSlot ?? <h1 className="text-xl font-semibold">{title}</h1>}
              {subtitle && (
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
              )}
            </div>
            {headerActions != null ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-0.5">
                {headerActions}
              </div>
            ) : null}
          </div>
          {headerExtension != null ? (
            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              {headerExtension}
            </div>
          ) : null}
        </div>

        {fillHeight ? (
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
            {children}
          </main>
        ) : (
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        )}
      </div>
    </div>
  );
}

function Avatar({ src, fallback }: { src: string | null | undefined; fallback: string }) {
  if (src) {
    return <img src={src} alt="" className="size-7 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
      {fallback.slice(0, 1).toUpperCase()}
    </span>
  );
}
