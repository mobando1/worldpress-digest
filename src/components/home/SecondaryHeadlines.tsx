import { ArticleCard } from "@/components/article/ArticleCard";

interface SecondaryHeadlinesProps {
  articles: Array<{
    id: string;
    title: string;
    summary: string | null;
    imageUrl: string | null;
    publishedAt: string | null;
    breakingScore: number;
    source: { name: string };
    category?: { name: string; slug: string; color: string } | null;
  }>;
}

export function SecondaryHeadlines({ articles }: SecondaryHeadlinesProps) {
  if (articles.length === 0) return null;

  return (
    <div className="flex flex-col divide-y divide-border">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} size="sm" />
      ))}
    </div>
  );
}
