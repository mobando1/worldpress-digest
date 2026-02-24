import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article/ArticleCard";
import { EmptyState } from "@/components/shared/EmptyState";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const CATEGORY_MAP: Record<string, { name: string; color: string }> = {
  "top-stories": { name: "Top Stories", color: "#1A1A1A" },
  world: { name: "World", color: "#2563EB" },
  business: { name: "Business", color: "#059669" },
  technology: { name: "Technology", color: "#7C3AED" },
  politics: { name: "Politics", color: "#DC2626" },
  science: { name: "Science", color: "#0891B2" },
  culture: { name: "Culture", color: "#D97706" },
  sports: { name: "Sports", color: "#EA580C" },
  health: { name: "Health", color: "#DB2777" },
};

async function getCategoryArticles(slug: string) {
  try {
    // First get the category
    const catRes = await fetch(`${APP_URL}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (!catRes.ok) return { category: null, articles: [] };
    const categories = await catRes.json();
    const category = (categories.data || []).find(
      (c: { slug: string }) => c.slug === slug
    );

    if (!category) return { category: null, articles: [] };

    const res = await fetch(
      `${APP_URL}/api/articles?categoryId=${category.id}&limit=24`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return { category, articles: [] };
    const json = await res.json();
    return { category, articles: json.data || [] };
  } catch {
    return { category: null, articles: [] };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = CATEGORY_MAP[slug];

  if (!config) {
    notFound();
  }

  const { articles } = await getCategoryArticles(slug);

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      {/* Category header */}
      <div className="newspaper-rule mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold flex items-center gap-3">
          <span
            className="inline-block w-4 h-4 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          {config.name}
        </h1>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          title={`No ${config.name} articles yet`}
          description="Check back soon or trigger a fetch from the admin panel."
          action={{ label: "Go Home", href: "/" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {articles.map((article: any) => (
            <ArticleCard key={article.id} article={article} size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
