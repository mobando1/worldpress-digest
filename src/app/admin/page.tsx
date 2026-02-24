"use client";

import { useState, useEffect } from "react";
import { Newspaper, Globe, Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LastUpdated } from "@/components/shared/LastUpdated";

interface Stats {
  articleCount: number;
  sourceCount: number;
  lastFetch: string | null;
}

function StatsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-serif font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    articleCount: 0,
    sourceCount: 0,
    lastFetch: null,
  });
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);

  useEffect(() => {
    // Load basic stats from public APIs
    Promise.all([
      fetch("/api/articles?limit=1").then((r) => r.json()),
      fetch("/api/sources").then((r) => r.json()),
    ]).then(([articles, sources]) => {
      setStats({
        articleCount: articles.pagination?.total || 0,
        sourceCount: (sources.data || []).length,
        lastFetch: null,
      });
    }).catch(() => {});
  }, []);

  const triggerFetch = async () => {
    setFetching(true);
    setFetchResult(null);

    try {
      const token = getToken();
      const res = await fetch("/api/admin/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setFetchResult(`Error: ${data.error?.message || "Fetch failed"}`);
        return;
      }

      const results = data.data || [];
      const totalNew = results.reduce((s: number, r: any) => s + (r.articlesNew || 0), 0);
      const totalFound = results.reduce((s: number, r: any) => s + (r.articlesFound || 0), 0);
      setFetchResult(
        `Fetched ${results.length} sources: ${totalFound} articles found, ${totalNew} new.`
      );

      // Refresh stats
      fetch("/api/articles?limit=1")
        .then((r) => r.json())
        .then((d) =>
          setStats((prev) => ({
            ...prev,
            articleCount: d.pagination?.total || prev.articleCount,
            lastFetch: new Date().toISOString(),
          }))
        );
    } catch {
      setFetchResult("Error: Network request failed");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-3xl font-serif font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard
          label="Total Articles"
          value={stats.articleCount}
          icon={<Newspaper className="h-5 w-5" />}
        />
        <StatsCard
          label="Active Sources"
          value={stats.sourceCount}
          icon={<Globe className="h-5 w-5" />}
        />
        <StatsCard
          label="Last Fetch"
          value={stats.lastFetch ? "Recent" : "Never"}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Manual Fetch */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-serif font-semibold mb-2">
            Manual Fetch
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Trigger a manual fetch from all enabled RSS sources. This will
            discover new articles and update the database.
          </p>
          <div className="flex items-center gap-4">
            <Button onClick={triggerFetch} disabled={fetching}>
              {fetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Trigger Fetch
                </>
              )}
            </Button>
            {stats.lastFetch && <LastUpdated timestamp={stats.lastFetch} />}
          </div>
          {fetchResult && (
            <div
              className={`mt-4 p-3 text-sm rounded-md ${
                fetchResult.startsWith("Error")
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-500/10 text-green-700 dark:text-green-400"
              }`}
            >
              {fetchResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
