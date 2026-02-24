"use client";

import { useEffect, useState } from "react";
import { BookOpen, Lightbulb, Sparkles, Tag, ChevronDown, ChevronUp } from "lucide-react";

interface KeyTerm {
  term: string;
  definition: string;
}

interface Insights {
  educationalSummary: string;
  historicalContext: string;
  actionableInsight: string;
  keyTerms: KeyTerm[];
}

interface ArticleInsightsProps {
  articleId: string;
}

export function ArticleInsights({ articleId }: ArticleInsightsProps) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch(`/api/articles/${articleId}/insights`);
        if (!res.ok) {
          if (res.status === 503) {
            setError("unavailable");
          } else {
            setError("failed");
          }
          return;
        }
        const data = await res.json();
        setInsights(data.data);
      } catch {
        setError("failed");
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [articleId]);

  if (error === "unavailable") return null;
  if (error) return null;

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-4/5 bg-muted rounded" />
        <div className="h-3 w-3/5 bg-muted rounded" />
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">AI-Powered Insights</span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="p-5 space-y-5">
          {/* Educational Summary */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Why This Matters
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {insights.educationalSummary}
            </p>
          </div>

          {/* Historical Context */}
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border-l-3 border-indigo-500 rounded-r-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Historical Context
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insights.historicalContext}
            </p>
          </div>

          {/* Actionable Insight */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-3 border-emerald-500 rounded-r-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                What You Can Do
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insights.actionableInsight}
            </p>
          </div>

          {/* Key Terms */}
          {insights.keyTerms && insights.keyTerms.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Key Terms
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.keyTerms.map((kt) => (
                  <span
                    key={kt.term}
                    title={kt.definition}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-secondary text-muted-foreground rounded-full cursor-help hover:bg-accent transition-colors"
                  >
                    {kt.term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
