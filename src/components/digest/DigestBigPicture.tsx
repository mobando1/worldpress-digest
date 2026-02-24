import { Globe } from "lucide-react";

interface DigestBigPictureProps {
  content: string;
}

export function DigestBigPicture({ content }: DigestBigPictureProps) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-amber-700 dark:text-amber-400" />
        <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
          The Big Picture
        </h2>
      </div>
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        {content}
      </p>
    </div>
  );
}
