"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { Article, PaginatedResult, SearchFilters } from "@/lib/types";

interface UseSearchReturn {
  /** Current search query (raw, un-debounced). */
  query: string;
  /** Update the raw search query. */
  setQuery: (query: string) => void;
  /** Active filter state. */
  filters: SearchFilters;
  /** Merge partial filter updates. */
  setFilters: (filters: Partial<SearchFilters>) => void;
  /** Reset filters to defaults. */
  resetFilters: () => void;
  /** Paginated results from the latest fetch. */
  results: PaginatedResult<Article> | null;
  /** Whether a request is currently in-flight. */
  loading: boolean;
  /** Error message, if any. */
  error: string | null;
  /** Current page number. */
  page: number;
  /** Navigate to a specific page. */
  setPage: (page: number) => void;
  /** Manually trigger a refetch with the current query + filters. */
  refetch: () => void;
}

const DEFAULT_FILTERS: SearchFilters = {};
const DEFAULT_LIMIT = 20;

/**
 * Search hook that manages query, filters, pagination, and data fetching
 * against the `/api/articles` endpoint.
 *
 * The raw `query` value is debounced (500 ms) before requests are sent so
 * the API is not hammered on every keystroke.
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [filters, setFiltersState] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<PaginatedResult<Article> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounce(query, 500);

  const setFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
    setPage(1); // reset to first page when filters change
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setQuery("");
    setPage(1);
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (debouncedQuery) params.set("search", debouncedQuery);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.sourceId) params.set("sourceId", filters.sourceId);
      if (filters.language) params.set("language", filters.language);
      if (filters.country) params.set("country", filters.country);
      if (filters.fromDate) params.set("fromDate", filters.fromDate);
      if (filters.toDate) params.set("toDate", filters.toDate);

      params.set("page", String(page));
      params.set("limit", String(DEFAULT_LIMIT));

      const response = await fetch(`/api/articles?${params.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${response.status})`);
      }

      const data: PaginatedResult<Article> = await response.json();
      setResults(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters, page]);

  // Re-fetch whenever the debounced query, filters, or page change.
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    resetFilters,
    results,
    loading,
    error,
    page,
    setPage,
    refetch: fetchResults,
  };
}
