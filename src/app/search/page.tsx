"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArticleCard } from "@/components/article/ArticleCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { Pagination } from "@/components/shared/Pagination";
import { useSearchParams, useRouter } from "next/navigation";

interface ArticleResult {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  breakingScore: number;
  source: { name: string };
  category?: { name: string; slug: string; color: string } | null;
  sourceName?: string;
  categoryName?: string;
  categoryColor?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [articles, setArticles] = useState<ArticleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [sourceId, setSourceId] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [breakingOnly, setBreakingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("recent");

  // Sources for filter
  const [sources, setSources] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((d) => setSources(d.data || []))
      .catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    if (!query.trim()) {
      setArticles([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("search", query.trim());
      params.set("page", String(page));
      params.set("limit", "20");
      if (sourceId) params.set("sourceId", sourceId);
      if (language) params.set("language", language);

      const res = await fetch(`/api/articles?${params}`);
      const json = await res.json();

      let data = json.data || [];

      // Client-side filters
      if (breakingOnly) {
        data = data.filter((a: ArticleResult) => a.breakingScore >= 70);
      }

      // Normalize FTS results which may have flat fields
      data = data.map((a: any) => ({
        ...a,
        source: a.source || { name: a.sourceName || "Unknown" },
        category: a.category || (a.categoryName
          ? { name: a.categoryName, slug: a.categoryName.toLowerCase(), color: a.categoryColor || "#6B7280" }
          : null),
      }));

      if (sortBy === "relevant") {
        data.sort((a: any, b: any) => (b.relevance || 0) - (a.relevance || 0));
      }

      setArticles(data);
      setTotal(json.pagination?.total || data.length);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [query, page, sourceId, language, breakingOnly, sortBy]);

  useEffect(() => {
    const timer = setTimeout(doSearch, 300);
    return () => clearTimeout(timer);
  }, [doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    doSearch();
  };

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search articles, topics, sources..."
            className="h-14 pl-12 pr-12 rounded-lg text-lg border-border shadow-sm focus:shadow-md transition-shadow"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => { setQuery(""); setArticles([]); }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Filters bar */}
      <div className="flex items-center justify-between mb-6">
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            {total} result{total !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap gap-3 py-4 mb-6 border-y border-border">
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="relevant">Most Relevant</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              checked={breakingOnly}
              onCheckedChange={setBreakingOnly}
              id="breaking-filter"
            />
            <Label htmlFor="breaking-filter" className="text-sm">
              Breaking only
            </Label>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SkeletonLoader variant="card-md" count={8} />
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} size="md" />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      ) : query ? (
        <EmptyState
          title="No results found"
          description={`We couldn't find any articles matching "${query}". Try different keywords.`}
          action={{ label: "Go Home", href: "/" }}
        />
      ) : (
        <EmptyState
          title="Search for articles"
          description="Enter keywords to search across all aggregated news sources."
        />
      )}
    </div>
  );
}
