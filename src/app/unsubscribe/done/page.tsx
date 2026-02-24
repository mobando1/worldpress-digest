import Link from "next/link";
import { MailX } from "lucide-react";

export const metadata = {
  title: "Unsubscribed — WorldPress Digest",
};

export default function UnsubscribeDonePage() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <MailX className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-6" />

      <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-3">
        You&apos;ve Been Unsubscribed
      </h1>

      <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        You won&apos;t receive any more emails from WorldPress Digest. If this was
        a mistake, you can always re-subscribe.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/subscribe"
          className="inline-flex items-center justify-center border border-[var(--color-border-primary)] text-[var(--color-text-primary)] font-semibold px-6 py-2.5 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Re-subscribe
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center text-[var(--color-text-muted)] font-medium px-6 py-2.5 rounded-lg hover:text-[var(--color-text-primary)] transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
