import Image from "next/image";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <Image
        src="/ideamode_logo.svg"
        alt="IdeaMode"
        width={160}
        height={24}
        priority
        unoptimized
      />
      <p className="flex items-center gap-2 text-center text-zinc-900">
        <Lightbulb className="size-5 shrink-0" aria-hidden />
        Capture, develop, and validate ideas.
      </p>
      <Button variant="outline" size="sm" asChild>
        <a href="#">{apiUrl ? "API connected" : "Get started"}</a>
      </Button>
      {apiUrl && (
        <p className="text-sm text-muted-foreground">
          API: {apiUrl}
        </p>
      )}
    </main>
  );
}
