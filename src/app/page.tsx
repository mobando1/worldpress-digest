import { BreakingBanner } from "@/components/home/BreakingBanner";
import { EditionDate } from "@/components/home/EditionDate";
import { HeroArticle } from "@/components/home/HeroArticle";
import { SecondaryHeadlines } from "@/components/home/SecondaryHeadlines";
import { CategorySection } from "@/components/home/CategorySection";
import { TrendingColumn } from "@/components/home/TrendingColumn";
import { EmptyState } from "@/components/shared/EmptyState";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

async function getArticles(): Promise<ArticleData[]> {
  try {
    const res = await fetch(`${APP_URL}/api/articles?limit=50`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function getBreaking(): Promise<ArticleData[]> {
  try {
    const res = await fetch(`${APP_URL}/api/articles/breaking?limit=5`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

const CATEGORY_CONFIG: Record<string, { name: string; color: string }> = {
  world: { name: "World", color: "#2563EB" },
  business: { name: "Business", color: "#059669" },
  technology: { name: "Technology", color: "#7C3AED" },
  politics: { name: "Politics", color: "#DC2626" },
  science: { name: "Science", color: "#0891B2" },
  culture: { name: "Culture", color: "#D97706" },
  sports: { name: "Sports", color: "#EA580C" },
};

export default async function HomePage() {
  const [articles, breakingArticles] = await Promise.all([
    getArticles(),
    getBreaking(),
  ]);

  if (articles.length === 0) {
    return (
      <div className="animate-[fade-in_0.3s_ease-out]">
        <EditionDate />
        <EmptyState
          title="No articles yet"
          description="The news pipeline hasn't run yet. Trigger a manual fetch from the admin panel or wait for the scheduled job."
          action={{ label: "Go to Admin", href: "/admin" }}
        />
      </div>
    );
  }

  // Hero = first article (preferring one with an image)
  const heroArticle = articles.find((a) => a.imageUrl) || articles[0];
  const secondaryArticles = articles
    .filter((a) => a.id !== heroArticle.id)
    .slice(0, 4);

  // Group remaining articles by category
  const categorized: Record<string, ArticleData[]> = {};
  for (const article of articles) {
    if (article.id === heroArticle.id) continue;
    const slug = article.category?.slug || "world";
    if (!categorized[slug]) categorized[slug] = [];
    if (categorized[slug].length < 3) {
      categorized[slug].push(article);
    }
  }

  // Trending = top articles by breakingScore
  const trending = [...articles]
    .sort((a, b) => b.breakingScore - a.breakingScore)
    .slice(0, 10);

  // Top breaking for banner
  const topBreaking = breakingArticles[0];

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      {/* Breaking banner */}
      {topBreaking && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-6">
          <BreakingBanner
            headline={topBreaking.title}
            articleId={topBreaking.id}
            timestamp={topBreaking.publishedAt || new Date().toISOString()}
          />
        </div>
      )}

      <EditionDate />

      {/* Hero section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-8">
          <HeroArticle article={heroArticle} />
        </div>
        <div className="lg:col-span-4">
          <SecondaryHeadlines articles={secondaryArticles} />
        </div>
      </section>

      {/* Separator */}
      <hr className="my-8 border-[var(--color-border-primary)]" />

      {/* Category sections + Trending sidebar */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-2">
          {Object.entries(CATEGORY_CONFIG).map(([slug, config]) => {
            const catArticles = categorized[slug];
            if (!catArticles || catArticles.length === 0) return null;
            return (
              <CategorySection
                key={slug}
                category={{ ...config, slug }}
                articles={catArticles}
              />
            );
          })}
        </div>
        <div className="lg:col-span-3">
          <TrendingColumn articles={trending} />
        </div>
      </section>
    </div>
  );
}
