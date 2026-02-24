import Link from "next/link";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { ArticleMeta } from "@/components/article/ArticleMeta";

interface HeroArticleProps {
  article: {
    id: string;
    title: string;
    summary: string | null;
    imageUrl: string | null;
    publishedAt: string | null;
    breakingScore: number;
    source: { name: string };
    category?: { name: string; slug: string; color: string } | null;
  };
}

export function HeroArticle({ article }: HeroArticleProps) {
  const isBreaking = article.breakingScore >= 70;

  return (
    <article className="group relative">
      {article.imageUrl && (
        <div className="relative aspect-[16/9] lg:aspect-[3/2] overflow-hidden rounded-lg">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          {isBreaking && (
            <span className="absolute top-4 left-4 bg-destructive text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
              Breaking
            </span>
          )}
        </div>
      )}

      <div className="mt-4">
        {article.category && (
          <CategoryBadge
            name={article.category.name}
            slug={article.category.slug}
            color={article.category.color}
          />
        )}
        <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-serif font-black leading-tight tracking-tight">
          <Link
            href={`/article/${article.id}`}
            className="text-foreground hover:underline decoration-2 underline-offset-4"
          >
            {article.title}
          </Link>
        </h1>
        {article.summary && (
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground line-clamp-3">
            {article.summary}
          </p>
        )}
        <ArticleMeta
          sourceName={article.source.name}
          publishedAt={article.publishedAt}
          compact
          className="mt-3"
        />
      </div>
    </article>
  );
}
