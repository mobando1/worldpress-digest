"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";

interface AlertRule {
  id: string;
  name: string;
  keywords: string[];
  minBreakingScore: number;
  channels: string[];
  enabled: boolean;
  categories: Array<{ id: string; name: string }>;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [minScore, setMinScore] = useState(50);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function createRule() {
    setCreating(true);
    try {
      const token = getToken();
      if (!token) return;

      const channels: string[] = ["IN_APP"];
      if (emailEnabled) channels.push("EMAIL");
      if (pushEnabled) channels.push("PUSH");

      const keywords = keywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          keywords,
          minBreakingScore: minScore,
          channels,
          categoryIds: [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) => [...prev, data.data]);
        setDialogOpen(false);
        resetForm();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function deleteRule(id: string) {
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  }

  async function toggleRule(id: string, enabled: boolean) {
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`/api/alerts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled } : r))
      );
    } catch {
      // ignore
    }
  }

  function resetForm() {
    setName("");
    setKeywordsInput("");
    setMinScore(50);
    setEmailEnabled(false);
    setPushEnabled(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Alert Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure breaking news notifications
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">
                Create Alert Rule
              </DialogTitle>
              <DialogDescription>
                Get notified when articles match your criteria.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Market Alerts"
                />
              </div>
              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g., earthquake, war, sanctions"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Breaking Score ({minScore})</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-3">
                <Label>Notification Channels</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email</span>
                  <Switch
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push</span>
                  <Switch
                    checked={pushEnabled}
                    onCheckedChange={setPushEnabled}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={createRule} disabled={creating || !name.trim()}>
                {creating ? "Creating..." : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-full h-full" />}
          title="No alert rules"
          description="Create alert rules to get notified when breaking news matches your criteria. Sign in first to manage alerts."
          action={{ label: "Sign In", href: "/login" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-serif">
                    {rule.name}
                  </CardTitle>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) =>
                      toggleRule(rule.id, checked)
                    }
                  />
                </div>
                <CardDescription>
                  Score &ge; {rule.minBreakingScore}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rule.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {rule.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  {rule.channels.map((ch) => (
                    <Badge key={ch} variant="outline" className="text-xs">
                      {ch}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteRule(rule.id)}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
