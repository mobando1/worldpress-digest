// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { name: "World",         slug: "world",         color: "hsl(220, 70%, 50%)",  icon: "globe" },
  { name: "Politics",      slug: "politics",      color: "hsl(0, 70%, 50%)",    icon: "landmark" },
  { name: "Business",      slug: "business",      color: "hsl(145, 60%, 40%)",  icon: "briefcase" },
  { name: "Technology",    slug: "technology",     color: "hsl(260, 60%, 55%)",  icon: "cpu" },
  { name: "Science",       slug: "science",       color: "hsl(190, 70%, 45%)",  icon: "flask-conical" },
  { name: "Health",        slug: "health",        color: "hsl(340, 65%, 50%)",  icon: "heart-pulse" },
  { name: "Sports",        slug: "sports",        color: "hsl(30, 80%, 50%)",   icon: "trophy" },
  { name: "Entertainment", slug: "entertainment", color: "hsl(290, 60%, 55%)",  icon: "clapperboard" },
  { name: "Opinion",       slug: "opinion",       color: "hsl(50, 70%, 45%)",   icon: "message-square" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

/**
 * Map category slug -> CSS colour string.
 * Useful for badges, borders, and accent colours throughout the UI.
 */
export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.color])
);

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

export const REGIONS: { value: string; label: string }[] = [
  { value: "north-america",  label: "North America" },
  { value: "south-america",  label: "South America" },
  { value: "europe",         label: "Europe" },
  { value: "middle-east",    label: "Middle East" },
  { value: "africa",         label: "Africa" },
  { value: "asia",           label: "Asia" },
  { value: "oceania",        label: "Oceania" },
  { value: "global",         label: "Global" },
];

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

export const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "hi", label: "Hindi" },
  { value: "ru", label: "Russian" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "sv", label: "Swedish" },
  { value: "tr", label: "Turkish" },
];
