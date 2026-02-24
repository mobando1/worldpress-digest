import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { ArticleMeta } from "./ArticleMeta";
import { ArticleCard } from "./ArticleCard";

interface ArticleDetailProps {
  article: {
    id: string;
    title: string;
    summary: string | null;
    content: string | null;
    imageUrl: string | null;
    publishedAt: string | null;
    author: string | null;
    sourceUrl: string;
    tags: string[];
    source: { name: string; url: string };
    category?: { name: string; slug: string; color: string } | null;
  };
  relatedArticles?: Array<{
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

export function ArticleDetail({ article, relatedArticles = [] }: ArticleDetailProps) {
  return (
    <article className="max-w-[720px] mx-auto">
      {article.category && (
        <CategoryBadge
          name={article.category.name}
          slug={article.category.slug}
          color={article.category.color}
          className="mb-3"
        />
      )}

      <h1 className="text-3xl md:text-4xl font-serif font-black leading-tight tracking-tight">
        {article.title}
      </h1>

      <ArticleMeta
        sourceName={article.source.name}
        publishedAt={article.publishedAt}
        author={article.author}
        className="mt-4 pb-4 border-b border-border"
      />

      {article.imageUrl && (
        <figure className="mt-6">
          <div className="relative aspect-[16/9] rounded-md overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </figure>
      )}

      {/* Summary / excerpt */}
      {article.summary && (
        <div className="mt-8">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {article.summary}
          </p>
        </div>
      )}

      {article.content && article.content !== article.summary && (
        <div className="mt-4">
          <p className="text-base leading-relaxed text-foreground">
            {article.content}
          </p>
        </div>
      )}

      {/* Read original */}
      <div className="mt-8 p-4 bg-secondary rounded-lg flex items-center gap-3">
        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <span className="text-sm text-muted-foreground">Read the full article at </span>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            {article.source.name}
          </a>
        </div>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 text-xs font-medium bg-secondary text-muted-foreground rounded-full hover:bg-accent transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-serif font-bold newspaper-rule mb-6">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedArticles.map((a) => (
              <ArticleCard key={a.id} article={a} size="md" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
