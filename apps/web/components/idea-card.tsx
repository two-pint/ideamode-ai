"use client";

import Link from "next/link";
import { type Idea } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IdeaCardProps = {
  idea: Idea;
  ownerUsername?: string | null;
};

export function IdeaCard({ idea, ownerUsername }: IdeaCardProps) {
  const username = ownerUsername || idea.owner?.username;
  const href = username ? `/${username}/${idea.slug}` : "#";

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardDescription className="uppercase">{idea.status}</CardDescription>
        <CardTitle className="text-base">
          {username ? (
            <Link href={href} className="hover:underline">
              {idea.title}
            </Link>
          ) : (
            idea.title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="line-clamp-2 text-sm text-zinc-600">
          {idea.description || "No description yet."}
        </p>
        <p className="text-xs text-zinc-500">
          Updated {new Date(idea.updated_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
