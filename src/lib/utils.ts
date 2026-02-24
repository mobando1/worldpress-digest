import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

/**
 * Format a date as "Jan 23, 2026".
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", DATE_FORMAT);
}

const RELATIVE_UNITS: { max: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { max: 60, divisor: 1, unit: "second" },
  { max: 3_600, divisor: 60, unit: "minute" },
  { max: 86_400, divisor: 3_600, unit: "hour" },
  { max: 2_592_000, divisor: 86_400, unit: "day" },
  { max: 31_536_000, divisor: 2_592_000, unit: "month" },
  { max: Infinity, divisor: 31_536_000, unit: "year" },
];

/**
 * Return a human-friendly relative date string, e.g. "2 hours ago", "3 days ago".
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSec = Math.round((d.getTime() - Date.now()) / 1_000);
  const absDiff = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const { max, divisor, unit } of RELATIVE_UNITS) {
    if (absDiff < max) {
      const value = Math.round(diffSec / divisor);
      return rtf.format(value, unit);
    }
  }

  // Fallback (should never reach here)
  return formatDate(d);
}

const NEWSPAPER_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
};

/**
 * Format a date for the newspaper masthead: "Monday, February 23, 2026".
 * Defaults to today when no date is provided.
 */
export function formatNewspaperDate(date?: Date): string {
  const d = date ?? new Date();
  return d.toLocaleDateString("en-US", NEWSPAPER_DATE_FORMAT);
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Convert arbitrary text into a URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")       // spaces -> hyphens
    .replace(/[^\w-]+/g, "")    // remove non-word chars (except hyphens)
    .replace(/--+/g, "-")       // collapse multiple hyphens
    .replace(/^-+/, "")         // trim leading hyphens
    .replace(/-+$/, "");        // trim trailing hyphens
}

/**
 * Truncate a string to `length` characters, appending an ellipsis if truncated.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "\u2026";
}
