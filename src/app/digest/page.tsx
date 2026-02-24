import Link from "next/link";
import { DigestStory } from "@/components/digest/DigestStory";
import { DigestBigPicture } from "@/components/digest/DigestBigPicture";
import { EmptyState } from "@/components/shared/EmptyState";
import type { DigestContent } from "@/services/DigestService";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daily Digest — WorldPress Digest",
  description:
    "Today's AI-powered news digest with educational insights, historical context, and actionable advice.",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface DigestEditionData {
  id: string;
  date: string;
  subject: string;
  jsonContent: DigestContent;
  status: string;
  generatedAt: string | null;
}

async function getLatestDigest(): Promise<DigestEditionData | null> {
  try {
    const res = await fetch(`${APP_URL}/api/digest/latest`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export default async function DigestPage() {
  const digest = await getLatestDigest();

  if (!digest || !digest.jsonContent?.stories) {
    return (
      <div className="animate-[fade-in_0.3s_ease-out]">
        <EmptyState
          title="No digest yet"
          description="The AI-powered daily digest hasn't been generated yet. Check back soon or subscribe to get it delivered to your inbox."
          action={{ label: "Subscribe", href: "/subscribe" }}
        />
      </div>
    );
  }

  const content = digest.jsonContent;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">
          Daily Digest
        </p>
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
          {digest.generatedAt && (
            <span> · Generated at {new Date(digest.generatedAt).toLocaleTimeString()}</span>
          )}
        </p>
      </header>

      {/* Big Picture */}
      {content.bigPicture && (
        <DigestBigPicture content={content.bigPicture} />
      )}

      {/* Stories */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-6">
          Today&apos;s Stories
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
