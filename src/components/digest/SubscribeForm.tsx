"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }

      setStatus("success");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          Check your email!
        </h3>
        <p className="text-[var(--color-text-secondary)]">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="subscribe-name"
          className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
        >
          Name (optional)
        </label>
        <input
          id="subscribe-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="subscribe-email"
          className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
        >
          Email address
        </label>
        <input
          id="subscribe-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-500">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !email}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        {status === "loading" ? "Subscribing..." : "Subscribe for Free"}
      </button>
    </form>
  );
}
