import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  variant: "hero" | "card-lg" | "card-md" | "card-sm" | "trending-item";
  count?: number;
}

function HeroSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[16/9] lg:aspect-[3/2] w-full rounded-lg" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

function CardLgSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function CardMdSkeleton() {
  return (
    <div className="bg-card rounded-md shadow-sm overflow-hidden">
      <Skeleton className="aspect-[3/2] w-full" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

function CardSmSkeleton() {
  return (
    <div className="py-3 border-b border-border last:border-0 space-y-2">
      <Skeleton className="h-3 w-14" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function TrendingItemSkeleton() {
  return (
    <div className="flex gap-3 py-3">
      <Skeleton className="h-8 w-8 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

const VARIANTS = {
  hero: HeroSkeleton,
  "card-lg": CardLgSkeleton,
  "card-md": CardMdSkeleton,
  "card-sm": CardSmSkeleton,
  "trending-item": TrendingItemSkeleton,
};

export function SkeletonLoader({ variant, count = 1 }: SkeletonLoaderProps) {
  const Component = VARIANTS[variant];
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
