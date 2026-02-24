import { BookOpen, Lightbulb, Link2 } from "lucide-react";

interface DigestStoryProps {
  headline: string;
  educationalSummary: string;
  historicalContext: string;
  actionableInsight: string;
  connectedTo: string[];
  category?: string;
}

export function DigestStory({
  headline,
  educationalSummary,
  historicalContext,
  actionableInsight,
  connectedTo,
  category,
}: DigestStoryProps) {
  return (
    <article className="border-b border-[var(--color-border-primary)] pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
      {category && (
        <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide mb-2">
          {category}
        </span>
      )}

      <h3 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight mb-3">
        {headline}
      </h3>

      <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
        {educationalSummary}
      </p>

      {/* Historical Context */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 border-l-3 border-indigo-500 rounded-r-lg px-4 py-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Historical Context
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {historicalContext}
        </p>
      </div>

      {/* Actionable Insight */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-3 border-emerald-500 rounded-r-lg px-4 py-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            What You Can Do
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {actionableInsight}
        </p>
      </div>

      {/* Connected Stories */}
      {connectedTo.length > 0 && (
        <div className="flex items-start gap-1.5 mt-3">
          <Link2 className="w-3.5 h-3.5 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold">Connected to:</span>{" "}
            {connectedTo.join(" · ")}
          </p>
        </div>
      )}
    </article>
  );
}
