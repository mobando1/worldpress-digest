import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "Confirmed — WorldPress Digest",
};

export default function ConfirmedPage() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />

      <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-3">
        You&apos;re In!
      </h1>

      <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        Your subscription is confirmed. You&apos;ll receive the WorldPress Digest
        every morning with AI-powered insights, historical context, and
        actionable advice.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/digest"
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Read Latest Digest
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-[var(--color-border-primary)] text-[var(--color-text-primary)] font-semibold px-6 py-2.5 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
