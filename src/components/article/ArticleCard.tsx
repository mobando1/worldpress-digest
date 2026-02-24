import Link from "next/link";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { ArticleMeta } from "./ArticleMeta";

interface ArticleData {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  breakingScore: number;
  source: { name: string };
  category?: { name: string; slug: string; color: string } | null;
}

interface ArticleCardProps {
  article: ArticleData;
  size: "lg" | "md" | "sm";
  className?: string;
}

export function ArticleCard({ article, size, className = "" }: ArticleCardProps) {
  const isBreaking = article.breakingScore >= 70;

  if (size === "sm") {
    return (
      <article className={`group py-3 border-b border-border last:border-0 ${className}`}>
        {article.category && (
          <CategoryBadge
            name={article.category.name}
            slug={article.category.slug}
            color={article.category.color}
            size="sm"
          />
        )}
        <h3 className="mt-1 text-base font-serif font-semibold leading-snug line-clamp-2 group-hover:underline">
          <Link href={`/article/${article.id}`}>
            {article.title}
          </Link>
        </h3>
        <ArticleMeta
          sourceName={article.source.name}
          publishedAt={article.publishedAt}
          compact
          className="mt-1.5"
        />
      </article>
    );
  }

  if (size === "lg") {
    return (
      <article className={`group bg-card rounded-lg shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 overflow-hidden ${className}`}>
        {article.imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              loading="lazy"
            />
            {isBreaking && (
              <span className="absolute top-3 left-3 bg-destructive text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                Breaking
              </span>
            )}
          </div>
        )}
        <div className="p-5">
          {article.category && (
            <CategoryBadge
              name={article.category.name}
              slug={article.category.slug}
              color={article.category.color}
            />
          )}
          <h3 className="mt-2 text-xl md:text-2xl font-serif font-semibold leading-snug">
            <Link
              href={`/article/${article.id}`}
              className="text-foreground hover:underline decoration-1 underline-offset-2"
            >
              {article.title}
            </Link>
          </h3>
          {article.summary && (
            <p className="mt-2 text-base text-muted-foreground line-clamp-3">
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

  // size === "md" (default)
  return (
    <article className={`group bg-card rounded-md shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${className}`}>
      {article.imageUrl && (
        <div className="relative aspect-[3/2] overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />
          {isBreaking && (
            <span className="absolute top-2 left-2 bg-destructive text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
              Breaking
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        {article.category && (
          <CategoryBadge
            name={article.category.name}
            slug={article.category.slug}
            color={article.category.color}
          />
        )}
        <h3 className="mt-1.5 text-lg font-serif font-semibold leading-snug line-clamp-2">
          <Link
            href={`/article/${article.id}`}
            className="text-foreground hover:underline decoration-1 underline-offset-2"
          >
            {article.title}
          </Link>
        </h3>
        {article.summary && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
            {article.summary}
          </p>
        )}
        <ArticleMeta
          sourceName={article.source.name}
          publishedAt={article.publishedAt}
          compact
          className="mt-2"
        />
      </div>
    </article>
  );
}
