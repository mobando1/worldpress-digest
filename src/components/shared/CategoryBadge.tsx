const CATEGORY_COLORS: Record<string, string> = {
  "top-stories": "#1A1A1A",
  world: "#2563EB",
  business: "#059669",
  technology: "#7C3AED",
  politics: "#DC2626",
  science: "#0891B2",
  culture: "#D97706",
  sports: "#EA580C",
  health: "#DB2777",
  opinion: "#4F46E5",
};

interface CategoryBadgeProps {
  name: string;
  slug: string;
  color?: string;
  size?: "sm" | "default";
  className?: string;
}

export function CategoryBadge({
  name,
  slug,
  color,
  size = "default",
  className = "",
}: CategoryBadgeProps) {
  const badgeColor = color || CATEGORY_COLORS[slug] || "#6B7280";

  return (
    <span
      className={`inline-flex items-center rounded font-sans font-bold uppercase tracking-wider ${
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
      } ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
        color: badgeColor,
      }}
    >
      {name}
    </span>
  );
}
