import Link from "next/link";

const SECTIONS = [
  { name: "World", href: "/category/world" },
  { name: "Business", href: "/category/business" },
  { name: "Technology", href: "/category/technology" },
  { name: "Politics", href: "/category/politics" },
  { name: "Science", href: "/category/science" },
  { name: "Culture", href: "/category/culture" },
  { name: "Sports", href: "/category/sports" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-foreground bg-secondary">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Sections */}
          <div>
            <h3 className="text-overline mb-4">Sections</h3>
            <ul className="space-y-2">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-overline mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  News aggregator
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  RSS-powered
                </span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-overline mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  Content belongs to original sources
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Links to original articles
                </span>
              </li>
            </ul>
          </div>

          {/* Admin */}
          <div>
            <h3 className="text-overline mb-4">Admin</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/sources"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Manage Sources
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/alerts"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Alert Rules
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--color-border-primary)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} WorldPress Digest. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            News aggregated from global sources. All content belongs to its respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
