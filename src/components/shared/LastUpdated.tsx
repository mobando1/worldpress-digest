interface LastUpdatedProps {
  timestamp: string | null;
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
  return `${diffDay}d ago`;
}

export function LastUpdated({ timestamp, className = "" }: LastUpdatedProps) {
  return (
    <span className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      {timestamp ? `Updated ${formatRelative(timestamp)}` : "Not yet fetched"}
    </span>
  );
}
