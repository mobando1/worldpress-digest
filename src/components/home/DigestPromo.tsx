import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function DigestPromo() {
  return (
    <section className="my-8">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Get Smarter About the News
              </h3>
              <p className="text-indigo-100 text-sm mt-1 max-w-lg">
                Our AI-powered daily digest gives you context, historical
                connections, and actionable insights — not just headlines.
              </p>
            </div>
          </div>

          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors shrink-0"
          >
            Subscribe Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
    </section>
  );
}
