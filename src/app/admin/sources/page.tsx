"use client";

import { useState, useEffect } from "react";
import { Globe, ExternalLink, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Source {
  id: string;
  name: string;
  slug: string;
  url: string;
  rssUrl: string | null;
  type: string;
  region: string | null;
  language: string;
  category: string | null;
  enabled: boolean;
  status: string;
  lastFetchedAt: string | null;
  config: Record<string, any>;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400",
    PAUSED: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    ERROR: "bg-red-500/10 text-red-700 dark:text-red-400",
    DISABLED: "bg-gray-500/10 text-gray-500",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[status] || variants.DISABLED}`}>
      {status}
    </span>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    try {
      const token = getToken();
      const res = await fetch("/api/admin/sources", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setSources(data.data || []);
    } catch {
      // If no auth, try public endpoint
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSource(id: string, enabled: boolean) {
    setToggling(id);
    try {
      const token = getToken();
      await fetch(`/api/admin/sources/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ enabled }),
      });
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
    } catch {
      // revert
    } finally {
      setToggling(null);
    }
  }

  const enabledCount = sources.filter((s) => s.enabled).length;
  const disabledCount = sources.filter((s) => !s.enabled).length;

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enabledCount} enabled, {disabledCount} disabled
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-overline">Source</TableHead>
                  <TableHead className="text-overline">Type</TableHead>
                  <TableHead className="text-overline">Region</TableHead>
                  <TableHead className="text-overline">Status</TableHead>
                  <TableHead className="text-overline">Enabled</TableHead>
                  <TableHead className="text-overline text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id} className="hover:bg-accent/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{source.name}</p>
                          {source.category && (
                            <p className="text-xs text-muted-foreground">
                              {source.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {source.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {source.region || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={source.status} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={(checked) =>
                          toggleSource(source.id, checked)
                        }
                        disabled={toggling === source.id}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes for disabled sources */}
      {sources.some((s) => !s.enabled && s.config?.note) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-serif">
              Unavailable Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sources
                .filter((s) => !s.enabled && s.config?.note)
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <strong>{s.name}:</strong> {String(s.config.note)}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
