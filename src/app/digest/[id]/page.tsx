import Link from "next/link";
import { notFound } from "next/navigation";
import { DigestStory } from "@/components/digest/DigestStory";
import { DigestBigPicture } from "@/components/digest/DigestBigPicture";
import type { DigestContent } from "@/services/DigestService";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface DigestEditionData {
  id: string;
  date: string;
  subject: string;
  jsonContent: DigestContent;
  status: string;
  generatedAt: string | null;
}

async function getDigest(id: string): Promise<DigestEditionData | null> {
  try {
    const res = await fetch(`${APP_URL}/api/digest/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const digest = await getDigest(id);

  if (!digest || !digest.jsonContent?.stories) {
    notFound();
  }

  const content = digest.jsonContent;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/digest"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block"
        >
          &larr; Latest Digest
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-3">
          {digest.subject}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {new Date(digest.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Big Picture */}
      {content.bigPicture && (
        <DigestBigPicture content={content.bigPicture} />
      )}

      {/* Stories */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-6">
          Stories
        </h2>
        {content.stories.map((story, i) => (
          <DigestStory key={story.articleId || i} {...story} />
        ))}
      </div>

      {/* CTA */}
      <div className="text-center py-8 border-t border-[var(--color-border-primary)]">
        <p className="text-[var(--color-text-secondary)] mb-4">
          Get this delivered to your inbox every morning.
        </p>
        <Link
          href="/subscribe"
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Subscribe for Free
        </Link>
      </div>
    </div>
  );
}
