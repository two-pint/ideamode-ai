"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { IdeaCard } from "@/components/idea-card";
import { type Idea, type User, ApiError, usersApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";

type ProfileUser = Pick<User, "id" | "username" | "name" | "avatar_url" | "bio">;

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { user, token, ready } = useRequireAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) return;

    setLoading(true);
    Promise.all([
      usersApi.getProfile(token, params.username),
      usersApi.getIdeas(token, params.username),
    ])
      .then(([profileRes, ideasRes]) => {
        setProfile(profileRes.user);
        setIdeas(ideasRes.ideas);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          router.replace("/not-found");
        }
      })
      .finally(() => setLoading(false));
  }, [params.username, ready, router, token]);

  if (!ready || !user || !token || loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  const isOwner = user.username === profile.username;
  const subtitle = isOwner
    ? "Manage your profile and ideas"
    : `Viewing @${profile.username}'s profile`;

  return (
    <AppShell title={profile.name || `@${profile.username}`} subtitle={subtitle} active="profile">
      <div className="mb-6 rounded-xl border bg-white p-5">
        <p className="text-sm text-zinc-500">@{profile.username}</p>
        <h2 className="mt-1 text-2xl font-semibold">{profile.name || "Unnamed user"}</h2>
        <p className="mt-3 text-sm text-zinc-600">{profile.bio || "No bio yet."}</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">{isOwner ? "Your ideas" : "Shared ideas"}</h3>
        {ideas.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {isOwner ? "You have not created any ideas yet." : "No ideas are visible for this user."}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} ownerUsername={profile.username} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
