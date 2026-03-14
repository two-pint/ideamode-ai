import Image from "next/image";

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
      <p className="text-center text-zinc-900">
        Capture, develop, and validate ideas.
      </p>
      {apiUrl && (
        <p className="text-sm text-zinc-600">
          API: {apiUrl}
        </p>
      )}
    </main>
  );
}
