import Link from "next/link";

interface BreakingBannerProps {
  headline: string;
  articleId: string;
  timestamp: string;
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BreakingBanner({ headline, articleId, timestamp }: BreakingBannerProps) {
  return (
    <div className="bg-destructive text-white px-4 py-2" style={{ animation: "pulse-breaking 3s ease-in-out infinite" }}>
      <div className="mx-auto max-w-[1440px] flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          Breaking
        </span>
        <Link
          href={`/article/${articleId}`}
          className="text-sm font-medium truncate text-white hover:underline"
        >
          {headline}
        </Link>
        <span className="text-xs opacity-75 shrink-0">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
