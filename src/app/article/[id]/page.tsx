import { notFound } from "next/navigation";
import { ArticleDetail } from "@/components/article/ArticleDetail";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getArticle(id: string) {
  try {
    const res = await fetch(`${APP_URL}/api/articles/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

async function getRelated(categoryId: string | null, excludeId: string) {
  if (!categoryId) return [];
  try {
    const res = await fetch(
      `${APP_URL}/api/articles?categoryId=${categoryId}&limit=4`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).filter((a: { id: string }) => a.id !== excludeId).slice(0, 2);
  } catch {
    return [];
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  const related = await getRelated(article.categoryId, article.id);

  return (
    <div className="animate-[fade-in_0.3s_ease-out] py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 lg:col-start-3">
          <ArticleDetail article={article} relatedArticles={related} />
        </div>
      </div>
    </div>
  );
}
