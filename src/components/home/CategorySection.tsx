import Link from "next/link";
import { ArticleCard } from "@/components/article/ArticleCard";

interface CategorySectionProps {
  category: {
    name: string;
    slug: string;
    color: string;
  };
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
  showViewAll?: boolean;
}

export function CategorySection({
  category,
  articles,
  showViewAll = true,
}: CategorySectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between newspaper-rule mb-6">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          {category.name}
        </h2>
        {showViewAll && (
          <Link
            href={`/category/${category.slug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all &rarr;
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} size="md" />
        ))}
      </div>
    </section>
  );
}
