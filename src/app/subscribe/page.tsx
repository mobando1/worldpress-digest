import { SubscribeForm } from "@/components/digest/SubscribeForm";
import { BookOpen, Lightbulb, Link2, Sparkles } from "lucide-react";

export const metadata = {
  title: "Subscribe — WorldPress Digest",
  description:
    "Get smarter about the news with our AI-powered daily digest. Historical context, actionable insights, and educational analysis delivered to your inbox.",
};

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description:
      "Claude AI breaks down complex news into clear, educational summaries that help you truly understand what's happening.",
  },
  {
    icon: BookOpen,
    title: "Historical Context",
    description:
      "Every story comes with historical connections and timelines so you can see the bigger picture.",
  },
  {
    icon: Lightbulb,
    title: "Actionable Insights",
    description:
      "Practical advice you can act on — from financial moves to civic actions to tools to try.",
  },
  {
    icon: Link2,
    title: "Connect the Dots",
    description:
      "See how stories relate to each other across topics, regions, and timelines.",
  },
];

export default function SubscribePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Value proposition */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-4">
            Get Smarter About
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">
              the News
            </span>
          </h1>

          <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            Stop just reading headlines. Our free daily digest uses AI to give
            you the context, connections, and actionable insights that turn news
            into knowledge.
          </p>

          <div className="space-y-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Subscribe form */}
        <div className="lg:mt-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
              Subscribe for Free
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              One email per day. Unsubscribe anytime.
            </p>
            <SubscribeForm />
          </div>
        </div>
      </div>
    </div>
  );
}
