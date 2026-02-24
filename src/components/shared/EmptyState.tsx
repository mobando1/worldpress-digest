import { Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 mb-6 text-muted-foreground opacity-40">
        {icon ?? <Newspaper className="w-full h-full" />}
      </div>
      <h3 className="text-lg font-serif font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {description}
      </p>
      {action && (
        <Button variant="outline" className="mt-6" asChild={!!action.href}>
          {action.href ? (
            <Link href={action.href}>{action.label}</Link>
          ) : (
            <span onClick={action.onClick}>{action.label}</span>
          )}
        </Button>
      )}
    </div>
  );
}
