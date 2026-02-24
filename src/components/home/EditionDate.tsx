export function EditionDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-primary)]">
      <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
        {formatted}
      </p>
      <p className="text-xs text-muted-foreground">
        Today&apos;s Edition
      </p>
    </div>
  );
}
