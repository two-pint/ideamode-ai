"use client";

import Link from "next/link";
import { type Brainstorm, type BrainstormStatus } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BrainstormCardProps = {
  brainstorm: Brainstorm;
  ownerUsername?: string | null;
  /** When set, show a "shared by @username" badge (for items the current user doesn't own). */
  sharedByUsername?: string | null;
};

const statusVariant: Record<BrainstormStatus, "exploring" | "researching" | "ready" | "archived"> = {
  exploring: "exploring",
  researching: "researching",
  ready: "ready",
  archived: "archived",
};

export function BrainstormCard({
  brainstorm,
  ownerUsername,
  sharedByUsername,
}: BrainstormCardProps) {
  const username = ownerUsername ?? brainstorm.owner?.username;
  const href = username ? `/${username}/brainstorms/${brainstorm.slug}` : "#";

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={statusVariant[brainstorm.status]}>{brainstorm.status}</Badge>
          {sharedByUsername && (
            <span className="text-xs text-zinc-500">shared by @{sharedByUsername}</span>
          )}
        </div>
        <CardTitle className="text-base">
          {username ? (
            <Link href={href} className="hover:underline">
              {brainstorm.title}
            </Link>
          ) : (
            brainstorm.title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="line-clamp-2 text-sm text-zinc-600">
          {brainstorm.description || "No description yet."}
        </p>
        <p className="text-xs text-zinc-500">
          Updated {new Date(brainstorm.updated_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
