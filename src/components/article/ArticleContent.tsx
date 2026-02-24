"use client";

import DOMPurify from "dompurify";

interface ArticleContentProps {
  content: string;
  className?: string;
}

export function ArticleContent({ content, className = "" }: ArticleContentProps) {
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!isHtml) {
    return (
      <div className={className}>
        {content.split("\n").map((paragraph, i) =>
          paragraph.trim() ? (
            <p key={i} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ) : null
        )}
      </div>
    );
  }

  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p", "br", "b", "strong", "i", "em", "u", "a", "h1", "h2", "h3",
      "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "figure",
      "figcaption", "img", "span", "div", "sub", "sup",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class"],
  });

  return (
    <div
      className={`prose prose-lg max-w-none
        prose-headings:font-serif prose-headings:font-bold
        prose-p:leading-relaxed prose-p:text-foreground
        prose-a:text-primary prose-a:underline prose-a:underline-offset-2
        prose-strong:text-foreground prose-strong:font-semibold
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
        prose-img:rounded-md
        ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
