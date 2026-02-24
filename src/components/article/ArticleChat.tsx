"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ArticleChatProps {
  articleId: string;
  articleTitle: string;
}

const STARTERS = [
  "Explain this simply",
  "Why does this matter?",
  "What should I do?",
  "Give me more context",
];

const MAX_MESSAGES = 20;

export function ArticleChat({ articleId, articleTitle }: ArticleChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    if (messages.length >= MAX_MESSAGES) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/articles/${articleId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: err.error || "Sorry, I couldn't process that." },
        ]);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground shadow-lg rounded-full px-5 py-3 hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold hidden sm:inline">Ask about this article</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">
                Chat: {articleTitle}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-accent rounded transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me anything about this article
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 bg-secondary text-muted-foreground rounded-full hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-2" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary px-3 py-2 rounded-xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-3 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                messages.length >= MAX_MESSAGES
                  ? "Message limit reached"
                  : "Ask a question..."
              }
              disabled={loading || messages.length >= MAX_MESSAGES}
              className="flex-1 px-3 py-2 text-sm bg-secondary border-none rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || messages.length >= MAX_MESSAGES}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
