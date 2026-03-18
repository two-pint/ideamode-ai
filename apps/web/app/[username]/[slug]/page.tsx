"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy route /:username/:slug is no longer used.
 * Resources are now at /:username/brainstorms/:slug and /:username/ideas/:slug.
 * Redirect to not-found so old bookmarks don't show a generic page.
 */
export default function LegacySlugPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/not-found");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </main>
  );
}
