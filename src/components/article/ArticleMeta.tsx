interface ArticleMetaProps {
  sourceName: string;
  publishedAt: string | null;
  author?: string | null;
  compact?: boolean;
  className?: string;
}

function formatRelative(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleMeta({
  sourceName,
  publishedAt,
  author,
  compact = false,
  className = "",
}: ArticleMetaProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <span className="font-medium">{sourceName}</span>
        {publishedAt && (
          <>
            <span aria-hidden>&middot;</span>
            <time dateTime={publishedAt}>{formatRelative(publishedAt)}</time>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground ${className}`}>
      {author && <span className="font-medium">{author}</span>}
      <span className="font-medium text-muted-foreground">{sourceName}</span>
      {publishedAt && (
        <time dateTime={publishedAt} className="text-muted-foreground">
          {new Date(publishedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </time>
      )}
    </div>
  );
}
