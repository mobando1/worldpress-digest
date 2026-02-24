"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV_CATEGORIES = [
  { name: "World", slug: "world" },
  { name: "Business", slug: "business" },
  { name: "Technology", slug: "technology" },
  { name: "Politics", slug: "politics" },
  { name: "Science", slug: "science" },
  { name: "Culture", slug: "culture" },
  { name: "Sports", slug: "sports" },
  { name: "Health", slug: "health" },
];

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-[var(--color-bg-primary)]">
              <SheetTitle className="font-serif text-xl font-black mb-6">
                WorldPress Digest
              </SheetTitle>
              <nav className="flex flex-col gap-1">
                {NAV_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
                <hr className="my-3 border-[var(--color-border-primary)]" />
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                >
                  Admin Panel
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
              WorldPress
            </span>
            <span className="text-xs sm:text-sm font-medium text-[var(--color-text-tertiary)] tracking-wide uppercase">
              Digest
            </span>
          </Link>

          {/* Desktop actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  autoFocus
                  className="h-9 w-48 md:w-64 pl-3 pr-3 rounded-full text-sm
                    bg-secondary border border-[var(--color-border-primary)]
                    text-foreground placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            <ThemeToggle />
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Category navigation - desktop */}
        <nav className="hidden lg:flex items-center gap-6 h-10 overflow-x-auto">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
