import Link from "next/link";

interface TrendingColumnProps {
  articles: Array<{
    id: string;
    title: string;
    source: { name: string };
  }>;
}

export function TrendingColumn({ articles }: TrendingColumnProps) {
  if (articles.length === 0) return null;

  return (
    <aside className="lg:sticky lg:top-28">
      <h3 className="text-overline mb-4 pb-2 border-b-2 border-foreground">
        Trending Now
      </h3>
      <ol className="divide-y divide-border">
        {articles.map((article, i) => (
          <li key={article.id} className="flex gap-3 py-3 group">
            <span className="text-3xl font-serif font-black text-border group-hover:text-primary transition-colors shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h4 className="text-sm font-serif font-semibold leading-snug group-hover:underline">
                <Link href={`/article/${article.id}`}>{article.title}</Link>
              </h4>
              <span className="text-xs text-muted-foreground mt-1 block">
                {article.source.name}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
