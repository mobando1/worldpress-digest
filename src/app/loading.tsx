import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

export default function HomeLoading() {
  return (
    <div>
      {/* Edition date skeleton */}
      <div className="h-10 border-b border-border mb-6" />

      {/* Hero section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-8">
          <SkeletonLoader variant="hero" />
        </div>
        <div className="lg:col-span-4">
          <SkeletonLoader variant="card-sm" count={4} />
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Category section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader variant="card-md" count={6} />
          </div>
        </div>
        <div className="lg:col-span-3">
          <SkeletonLoader variant="trending-item" count={5} />
        </div>
      </section>
    </div>
  );
}
