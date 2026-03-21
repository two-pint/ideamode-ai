"use client";

import { useEffect } from "react";
import { recentAccessApi } from "@/lib/api";

type ResourceType = "brainstorm" | "idea";

/**
 * Records a server-side recent access when the user opens a brainstorm or idea detail page.
 * Failures are ignored (offline / stale token).
 */
export function useRecordRecentAccess(
  token: string | null,
  options: {
    resourceType: ResourceType;
    ownerUsername: string | undefined;
    slug: string | undefined;
    enabled: boolean;
  }
) {
  const { resourceType, ownerUsername, slug, enabled } = options;

  useEffect(() => {
    if (!token || !enabled || !ownerUsername || !slug) return;

    void recentAccessApi
      .record(token, {
        resource_type: resourceType,
        owner_username: ownerUsername,
        slug,
      })
      .catch(() => {
        /* non-blocking */
      });
  }, [token, resourceType, ownerUsername, slug, enabled]);
}
