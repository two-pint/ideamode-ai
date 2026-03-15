"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 bg-zinc-50 text-zinc-900">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-zinc-600">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="text-zinc-900 underline hover:no-underline">
        Go home
      </Link>
    </main>
  );
}
